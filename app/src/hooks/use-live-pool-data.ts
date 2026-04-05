import { useState, useEffect, useCallback } from 'react';
import { chainStatePromise } from '@/lib/chain-state';
import { fromNanoCET } from '../constants/token';

import { CET_CONTRACT_ADDRESS } from '@/lib/cetContract';
const REFRESH_INTERVAL_MS = 60_000;

interface DeDustPrice {
  address: string;
  price: string;
}

export interface PoolData {
  priceUsd: number | null;
  tvlUsd: number | null;
  volume24hUsd: number | null;
  tonPriceUsd: number | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const INITIAL_STATE: PoolData = {
  priceUsd: null,
  tvlUsd: null,
  volume24hUsd: null,
  tonPriceUsd: null,
  loading: true,
  error: null,
  lastUpdated: null,
};

/**
 * Returns an AbortSignal that fires after `ms` milliseconds.
 * Uses `AbortSignal.timeout()` when available (Chrome 103+, Safari 17.4+, Firefox 100+)
 * and falls back to `AbortController + setTimeout` for older runtimes.
 */
export function createTimeoutSignal(ms: number): AbortSignal {
  if (typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

export function useLivePoolData(): PoolData {
  const [data, setData] = useState<PoolData>(INITIAL_STATE);

  const fetchData = useCallback(async () => {
    try {
      const signal = createTimeoutSignal(8000);
      const isDev = import.meta.env.DEV;
      const pricesUrl = isDev ? '/api-dedust/v2/prices' : 'https://api.dedust.io/v2/prices';

      // Fetch chain state (cached promise) and live prices (small 1.1 KB)
      const [state, pricesRes] = await Promise.all([
        chainStatePromise,
        fetch(pricesUrl, { signal }),
      ]);

      if (!pricesRes.ok) {
        throw new Error('Failed to fetch DeDust prices');
      }

      const prices: DeDustPrice[] = await pricesRes.json();

      // Get TON USD price from prices endpoint
      const tonEntry = prices.find((p) => p.address === 'native');
      const tonPriceUsd = tonEntry ? parseFloat(tonEntry.price) : null;

      // Use reserves from state.json (cached/indexed)
      const { pool } = state;
      const reserveTon = pool.reserveTon ? parseFloat(pool.reserveTon) / 1e9 : null;
      const reserveCet = pool.reserveCet ? parseFloat(pool.reserveCet) : null; // Raw nanoCET

      // Look up CET price directly from prices endpoint
      const cetAddressLower = CET_CONTRACT_ADDRESS.toLowerCase();
      const cetEntry = prices.find(
        (p) => p.address.toLowerCase() === cetAddressLower
      );
      let priceUsd: number | null = cetEntry ? parseFloat(cetEntry.price) : null;

      let tvlUsd: number | null = null;
      let volume24hUsd: number | null = null;

      if (reserveTon !== null && reserveCet !== null && tonPriceUsd) {
        const reserveCetReadable = fromNanoCET(reserveCet);
        // Calculate CET price from reserves if not available in prices endpoint
        if (priceUsd === null && reserveCetReadable > 0) {
          priceUsd = (reserveTon / reserveCetReadable) * tonPriceUsd;
        }

        // TVL = 2× the TON side (symmetric pool)
        tvlUsd = reserveTon * tonPriceUsd * 2;

        // Note: volume_24h is not in state.json yet, so we'll skip it or 
        // rely on a future indexer update to include it.
        volume24hUsd = null; 
      }

      setData({
        priceUsd,
        tvlUsd,
        volume24hUsd,
        tonPriceUsd,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (err) {
      setData((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Fetch failed',
      }));
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  return data;
}
