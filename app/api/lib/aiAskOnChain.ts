import { redisGetJson, redisSetJson } from '@/api/lib/upstashRedis';
import { DEDUST_POOL_ADDRESS } from '@/lib/dedustUrls';
import { CET_CONTRACT_ADDRESS } from '@/lib/cetContract';
import { TOKEN_DECIMALS } from '../../src/constants/token';

export interface DeDustAsset {
  type: 'native' | 'jetton';
  address?: string;
}

export interface DeDustPoolStats {
  volume_24h?: string;
}

export interface DeDustPool {
  address: string;
  assets: [DeDustAsset, DeDustAsset];
  reserves: [string, string];
  stats?: DeDustPoolStats;
}

export interface DeDustPrice {
  address: string;
  price: string;
}

export interface OnChainContext {
  cetPriceUsd: string;
  tonPriceUsd: string;
  tvlUsd: string;
  volume24hUsd: string;
}

export function todayKeyUtc(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export async function fetchOnChainContextCached(): Promise<OnChainContext | null> {
  const cached = await redisGetJson<OnChainContext>('cet-ai:onchain:v1');
  if (cached) return cached;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    const [poolsRes, pricesRes] = await Promise.all([
      fetch('https://api.dedust.io/v2/pools', { signal: controller.signal }),
      fetch('https://api.dedust.io/v2/prices', { signal: controller.signal }),
    ]);
    clearTimeout(timeoutId);
    if (!poolsRes.ok || !pricesRes.ok) return null;
    const pools = (await poolsRes.json()) as DeDustPool[];
    const prices = (await pricesRes.json()) as DeDustPrice[];
    const tonEntry = prices.find((p) => p.address === 'native');
    const tonPriceUsd = tonEntry ? parseFloat(tonEntry.price) : null;
    if (!tonPriceUsd) return null;

    const cetPool = pools.find((p) => p.address === DEDUST_POOL_ADDRESS);
    const cetAddressLower = CET_CONTRACT_ADDRESS.toLowerCase();
    const cetEntry = prices.find((p) => p.address.toLowerCase() === cetAddressLower);
    let cetPriceUsd: number | null = cetEntry ? parseFloat(cetEntry.price) : null;

    let tvlUsd: number | null = null;
    let volume24hUsd: number | null = null;

    if (cetPool) {
      const tonIndex = cetPool.assets[0].type === 'native' ? 0 : 1;
      const cetIndex = tonIndex === 0 ? 1 : 0;

      const tonReserve = parseFloat(cetPool.reserves[tonIndex]) / 1e9;
      const cetReserve = parseFloat(cetPool.reserves[cetIndex]) / Math.pow(10, TOKEN_DECIMALS);

      if (cetPriceUsd === null && cetReserve > 0) {
        cetPriceUsd = (tonReserve / cetReserve) * tonPriceUsd;
      }

      tvlUsd = tonReserve * tonPriceUsd * 2;

      if (cetPool.stats?.volume_24h) {
        const volumeTon = parseFloat(cetPool.stats.volume_24h) / 1e9;
        volume24hUsd = volumeTon * tonPriceUsd;
      }
    }

    const out: OnChainContext = {
      cetPriceUsd: cetPriceUsd !== null ? cetPriceUsd.toFixed(4) : 'N/A',
      tonPriceUsd: tonPriceUsd.toFixed(4),
      tvlUsd: tvlUsd !== null ? tvlUsd.toFixed(2) : 'N/A',
      volume24hUsd: volume24hUsd !== null ? volume24hUsd.toFixed(2) : 'N/A',
    };
    void redisSetJson('cet-ai:onchain:v1', out, 30);
    return out;
  } catch {
    return null;
  }
}
