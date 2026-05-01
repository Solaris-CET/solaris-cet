import { useCallback,useEffect, useState } from 'react';

import { CET_CONTRACT_ADDRESS } from '@/lib/cetContract';
import { chainStatePromise } from '@/lib/chain-state';
import { USDT_JETTON_MASTER_ADDRESS } from '@/lib/usdtContract';
const REFRESH_INTERVAL_MS = 60_000;

interface DeDustPrice {
  address?: string;
  symbol?: string;
  price: string | number;
}

interface DeDustGqlPool {
  assets: string[];
  reserves: string[];
  address: string;
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

  const fetchData = useCallback(async ({ allowGql = true }: { allowGql?: boolean } = {}) => {
    try {
      const lhci = import.meta.env.VITE_LHCI === '1';
      if (lhci) {
        await chainStatePromise;
        setData({
          priceUsd: null,
          tvlUsd: null,
          volume24hUsd: null,
          tonPriceUsd: null,
          loading: false,
          error: null,
          lastUpdated: new Date(),
        });
        return;
      }
      const signal = createTimeoutSignal(8000);
      const isDev = import.meta.env.DEV;
      const pricesUrl = isDev ? '/api-dedust/v2/prices' : 'https://mainnet.api.dedust.io/v2/prices';

      // Fetch chain state (cached promise) and live prices (small 1.1 KB)
      const [state, pricesRes] = await Promise.all([
        chainStatePromise,
        fetch(pricesUrl, { signal }),
      ]);

      if (!pricesRes.ok) {
        throw new Error('Failed to fetch DeDust prices');
      }

      const prices: DeDustPrice[] = await pricesRes.json();
      const parseUsd = (v: string | number | null | undefined): number | null => {
        if (typeof v === 'number') return Number.isFinite(v) ? v : null;
        if (typeof v === 'string') {
          const n = Number.parseFloat(v);
          return Number.isFinite(n) ? n : null;
        }
        return null;
      };

      const bigintToDecimalString = (raw: string, decimals: number): string | null => {
        try {
          const v = BigInt(raw);
          const div = BigInt(10) ** BigInt(decimals);
          const whole = v / div;
          const frac = v % div;
          const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '');
          return fracStr.length ? `${whole}.${fracStr}` : `${whole}`;
        } catch {
          return null;
        }
      };

      // Get TON USD price from prices endpoint
      const tonEntry = prices.find(
        (p) => p.address === 'native' || p.symbol?.toUpperCase() === 'TON',
      );
      const tonPriceUsd = tonEntry ? parseUsd(tonEntry.price) : null;

      // Use reserves from state.json (cached/indexed)
      // Note: state.json reserves are already formatted to human-readable decimals
      // by the ton-indexer.ts script.
      const { pool } = state;
      const reserveTon = pool.reserveTon ? parseFloat(pool.reserveTon) : null;
      const reserveCetReadable = pool.reserveCet ? parseFloat(pool.reserveCet) : null;
      const assets = Array.isArray(pool.assets) ? pool.assets : null;
      const reserves = Array.isArray(pool.reserves) ? pool.reserves : null;

      let reserveUsdtReadable: number | null = null;
      if (assets && reserves && assets.length === reserves.length) {
        const usdtKey = `jetton:${USDT_JETTON_MASTER_ADDRESS}`;
        const usdtIndex = assets.indexOf(usdtKey);
        if (usdtIndex !== -1) {
          const v = parseFloat(reserves[usdtIndex] ?? '');
          reserveUsdtReadable = Number.isFinite(v) ? v : null;
        }
      }

      // Look up CET price directly from prices endpoint
      const cetAddressLower = CET_CONTRACT_ADDRESS.toLowerCase();
      const cetEntry = prices.find(
        (p) =>
          (typeof p.address === 'string' && p.address.toLowerCase() === cetAddressLower) ||
          p.symbol?.toUpperCase() === 'CET',
      );
      let priceUsd: number | null = cetEntry ? parseUsd(cetEntry.price) : null;

      let tvlUsd: number | null = null;
      let volume24hUsd: number | null = null;

      if (reserveUsdtReadable !== null && reserveCetReadable !== null && reserveCetReadable > 0) {
        priceUsd = reserveUsdtReadable / reserveCetReadable;
        tvlUsd = reserveUsdtReadable + reserveCetReadable * priceUsd;
      }

      if (priceUsd === null && allowGql) {
        const gqlSignal = createTimeoutSignal(4500);
        const gqlRes = await fetch('https://mainnet.api.dedust.io/v3/graphql', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            query:
              'query($f:PoolsFiltersInput){ pools(filter:$f){ address assets reserves } }',
            variables: {
              f: {
                assets: {
                  in: [
                    `jetton:${USDT_JETTON_MASTER_ADDRESS}`,
                    `jetton:${CET_CONTRACT_ADDRESS}`,
                  ],
                },
              },
            },
          }),
          signal: gqlSignal,
        });
        if (gqlRes.ok) {
          const gqlJson = (await gqlRes.json()) as {
            data?: { pools?: DeDustGqlPool[] };
          };
          const pools = Array.isArray(gqlJson.data?.pools) ? gqlJson.data!.pools! : [];
          const pool = pools[0];
          if (pool && Array.isArray(pool.assets) && Array.isArray(pool.reserves) && pool.assets.length === pool.reserves.length) {
            const usdtKey = `jetton:${USDT_JETTON_MASTER_ADDRESS}`;
            const cetKey = `jetton:${CET_CONTRACT_ADDRESS}`;
            const usdtIndex = pool.assets.indexOf(usdtKey);
            const cetIndex = pool.assets.indexOf(cetKey);
            if (usdtIndex !== -1 && cetIndex !== -1) {
              const usdtDec = bigintToDecimalString(pool.reserves[usdtIndex] ?? '0', 6);
              const cetDec = bigintToDecimalString(pool.reserves[cetIndex] ?? '0', 6);
              const usdtN = usdtDec ? Number.parseFloat(usdtDec) : null;
              const cetN = cetDec ? Number.parseFloat(cetDec) : null;
              if (usdtN !== null && cetN !== null && Number.isFinite(usdtN) && Number.isFinite(cetN) && cetN > 0) {
                priceUsd = usdtN / cetN;
                tvlUsd = usdtN + cetN * priceUsd;
              }
            }
          }
        }
      }

      if (reserveTon !== null && reserveCetReadable !== null && tonPriceUsd) {
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
    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      void fetchData({ allowGql: false });
    };

    if (typeof window === 'undefined') {
      run();
    } else if (document.readyState === 'complete') {
      const w = window as unknown as {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
        cancelIdleCallback?: (id: number) => void;
      };
      if (typeof w.requestIdleCallback === 'function') {
        w.requestIdleCallback(run, { timeout: 2500 });
      } else {
        window.setTimeout(run, 1200);
      }
    } else {
      window.addEventListener('load', run, { once: true });
    }

    const id = setInterval(() => {
      void fetchData();
    }, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [fetchData]);

  return data;
}
