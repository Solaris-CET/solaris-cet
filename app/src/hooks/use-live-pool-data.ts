import { useState, useEffect, useCallback } from 'react';

import { CET_CONTRACT_ADDRESS } from '@/lib/cetContract';
import { DEDUST_POOL_ADDRESS } from '@/lib/dedustUrls';
const CET_DECIMALS = 9;
const REFRESH_INTERVAL_MS = 60_000;

interface DeDustAsset {
  type: 'native' | 'jetton';
  address?: string;
}

interface DeDustPoolStats {
  volume_24h: string;
  fees_24h: string;
}

interface DeDustPool {
  address: string;
  assets: [DeDustAsset, DeDustAsset];
  reserves: [string, string];
  stats?: DeDustPoolStats;
}

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
      const poolsUrl = isDev ? '/api-dedust/v2/pools' : 'https://api.dedust.io/v2/pools';
      const pricesUrl = isDev ? '/api-dedust/v2/prices' : 'https://api.dedust.io/v2/prices';

      const [poolsRes, pricesRes] = await Promise.all([
        fetch(poolsUrl, { signal }),
        fetch(pricesUrl, { signal }),
      ]);

      if (!poolsRes.ok || !pricesRes.ok) {
        throw new Error('Failed to fetch DeDust data');
      }

      const pools: DeDustPool[] = await poolsRes.json();
      const prices: DeDustPrice[] = await pricesRes.json();

      // Get TON USD price from prices endpoint
      const tonEntry = prices.find((p) => p.address === 'native');
      const tonPriceUsd = tonEntry ? parseFloat(tonEntry.price) : null;

      // Find the CET/TON pool by address
      const cetPool = pools.find((p) => p.address === DEDUST_POOL_ADDRESS);

      // Look up CET price directly from prices endpoint
      const cetAddressLower = CET_CONTRACT_ADDRESS.toLowerCase();
      const cetEntry = prices.find(
        (p) => p.address.toLowerCase() === cetAddressLower
      );
      let priceUsd: number | null = cetEntry ? parseFloat(cetEntry.price) : null;

      let tvlUsd: number | null = null;
      let volume24hUsd: number | null = null;

      if (cetPool && tonPriceUsd) {
        // Determine which reserve index corresponds to TON vs CET
        const tonIndex = cetPool.assets[0].type === 'native' ? 0 : 1;
        const cetIndex = tonIndex === 0 ? 1 : 0;

        const tonReserve = parseFloat(cetPool.reserves[tonIndex]) / 1e9;
        const cetReserve = parseFloat(cetPool.reserves[cetIndex]) / 10 ** CET_DECIMALS;

        // Calculate CET price from reserves if not available in prices endpoint
        if (priceUsd === null && cetReserve > 0) {
          priceUsd = (tonReserve / cetReserve) * tonPriceUsd;
        }

        // TVL = 2× the TON side (symmetric pool)
        tvlUsd = tonReserve * tonPriceUsd * 2;

        // 24 h volume (in nanoTON → TON → USD)
        if (cetPool.stats?.volume_24h) {
          const volumeTon = parseFloat(cetPool.stats.volume_24h) / 1e9;
          volume24hUsd = volumeTon * tonPriceUsd;
        }
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
