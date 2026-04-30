import { corsJson, corsOptions } from '../../lib/http';

export const config = { runtime: 'nodejs' };

type CoinGeckoMarket = {
  id?: unknown;
  symbol?: unknown;
  name?: unknown;
  current_price?: unknown;
  market_cap?: unknown;
  total_volume?: unknown;
  fully_diluted_valuation?: unknown;
  price_change_percentage_24h?: unknown;
  last_updated?: unknown;
};

type MarketSnapshot = {
  id: string;
  symbol: string;
  name: string;
  priceUsd: number | null;
  marketCapUsd: number | null;
  volume24hUsd: number | null;
  fdvUsd: number | null;
  change24hPct: number | null;
  lastUpdated: string | null;
};

const DEFAULT_COIN_ID = 'the-open-network';
const DEFAULT_VS = 'usd';
const CACHE_TTL_MS = 25_000;

const cache = new Map<string, { expiresAt: number; value: MarketSnapshot; fetchedAt: number }>();

function toStr(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

function toNum(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

function clampId(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\-_.]/g, '').slice(0, 80) || DEFAULT_COIN_ID;
}

function clampVs(s: string): string {
  const v = s.toLowerCase().replace(/[^a-z]/g, '').slice(0, 12) || DEFAULT_VS;
  return v === 'usd' || v === 'eur' ? v : DEFAULT_VS;
}

function timeoutSignal(ms: number): AbortSignal {
  const anyAbort = AbortSignal as unknown as { timeout?: (ms: number) => AbortSignal };
  if (typeof anyAbort.timeout === 'function') return anyAbort.timeout(ms);
  const ac = new AbortController();
  setTimeout(() => ac.abort(), ms);
  return ac.signal;
}

async function fetchMarketSnapshot(coinId: string, vs: string): Promise<MarketSnapshot | null> {
  const url = new URL('https://api.coingecko.com/api/v3/coins/markets');
  url.searchParams.set('vs_currency', vs);
  url.searchParams.set('ids', coinId);
  url.searchParams.set('price_change_percentage', '24h');
  url.searchParams.set('per_page', '1');
  url.searchParams.set('page', '1');
  url.searchParams.set('sparkline', 'false');

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: timeoutSignal(4500),
  });
  if (!res.ok) return null;
  const raw = (await res.json()) as unknown;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const row = raw[0] as CoinGeckoMarket;
  const id = toStr(row.id) ?? coinId;
  const symbol = (toStr(row.symbol) ?? '').toUpperCase();
  const name = toStr(row.name) ?? id;

  return {
    id,
    symbol: symbol || id.toUpperCase(),
    name,
    priceUsd: toNum(row.current_price),
    marketCapUsd: toNum(row.market_cap),
    volume24hUsd: toNum(row.total_volume),
    fdvUsd: toNum(row.fully_diluted_valuation),
    change24hPct: toNum(row.price_change_percentage_24h),
    lastUpdated: toStr(row.last_updated),
  };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const url = new URL(req.url);
  const coinId = clampId(String(url.searchParams.get('id') ?? DEFAULT_COIN_ID));
  const vs = clampVs(String(url.searchParams.get('vs') ?? DEFAULT_VS));
  const cacheKey = `${coinId}:${vs}`;

  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > now) {
    return corsJson(
      req,
      200,
      { ok: true, source: 'coingecko', cached: true, fetchedAt: new Date(hit.fetchedAt).toISOString(), data: hit.value },
      { 'Cache-Control': 'public, max-age=20' },
    );
  }

  let fresh: MarketSnapshot | null;
  try {
    fresh = await fetchMarketSnapshot(coinId, vs);
  } catch {
    fresh = null;
  }

  if (!fresh) {
    if (hit) {
      return corsJson(
        req,
        200,
        { ok: true, source: 'coingecko', cached: true, stale: true, fetchedAt: new Date(hit.fetchedAt).toISOString(), data: hit.value },
        { 'Cache-Control': 'public, max-age=10' },
      );
    }
    return corsJson(req, 502, { ok: false, error: 'Upstream unavailable', source: 'coingecko' });
  }

  cache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, value: fresh, fetchedAt: now });

  return corsJson(
    req,
    200,
    { ok: true, source: 'coingecko', cached: false, fetchedAt: new Date(now).toISOString(), data: fresh },
    { 'Cache-Control': 'public, max-age=20' },
  );
}
