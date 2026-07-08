export const COINGECKO_MARKET_PATH = '/api/market/coingecko';
export const COINGECKO_MARKET_METHODS = 'GET, OPTIONS';

export const COINGECKO_MARKET_PROBE = {
  path: COINGECKO_MARKET_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  defaultCoinId: 'the-open-network' as const,
  defaultVsCurrency: 'usd' as const,
  supportedVsCurrencies: ['usd', 'eur'] as const,
  cacheTtlMs: 25_000,
  fetchTimeoutMs: 4500,
  upstreamUnavailableStatus: 502,
};

export type CoinGeckoMarketRow = {
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

export type MarketSnapshot = {
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

type CacheEntry = { expiresAt: number; value: MarketSnapshot; fetchedAt: number };

const cache = new Map<string, CacheEntry>();

export function coingeckoToStr(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

export function coingeckoToNum(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

export function clampCoingeckoCoinId(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\-_.]/g, '').slice(0, 80) || COINGECKO_MARKET_PROBE.defaultCoinId;
}

export function clampCoingeckoVsCurrency(s: string): string {
  const v = s.toLowerCase().replace(/[^a-z]/g, '').slice(0, 12) || COINGECKO_MARKET_PROBE.defaultVsCurrency;
  return (COINGECKO_MARKET_PROBE.supportedVsCurrencies as readonly string[]).includes(v)
    ? v
    : COINGECKO_MARKET_PROBE.defaultVsCurrency;
}

export function parseCoingeckoMarketQuery(url: URL): { coinId: string; vs: string; cacheKey: string } {
  const coinId = clampCoingeckoCoinId(String(url.searchParams.get('id') ?? COINGECKO_MARKET_PROBE.defaultCoinId));
  const vs = clampCoingeckoVsCurrency(String(url.searchParams.get('vs') ?? COINGECKO_MARKET_PROBE.defaultVsCurrency));
  return { coinId, vs, cacheKey: `${coinId}:${vs}` };
}

function coingeckoTimeoutSignal(ms: number): AbortSignal {
  const anyAbort = AbortSignal as unknown as { timeout?: (ms: number) => AbortSignal };
  if (typeof anyAbort.timeout === 'function') return anyAbort.timeout(ms);
  const ac = new AbortController();
  setTimeout(() => ac.abort(), ms);
  return ac.signal;
}

export function mapCoinGeckoMarketRow(row: CoinGeckoMarketRow, coinId: string): MarketSnapshot {
  const id = coingeckoToStr(row.id) ?? coinId;
  const symbol = (coingeckoToStr(row.symbol) ?? '').toUpperCase();
  const name = coingeckoToStr(row.name) ?? id;
  return {
    id,
    symbol: symbol || id.toUpperCase(),
    name,
    priceUsd: coingeckoToNum(row.current_price),
    marketCapUsd: coingeckoToNum(row.market_cap),
    volume24hUsd: coingeckoToNum(row.total_volume),
    fdvUsd: coingeckoToNum(row.fully_diluted_valuation),
    change24hPct: coingeckoToNum(row.price_change_percentage_24h),
    lastUpdated: coingeckoToStr(row.last_updated),
  };
}

export async function fetchCoingeckoMarketSnapshot(coinId: string, vs: string): Promise<MarketSnapshot | null> {
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
    signal: coingeckoTimeoutSignal(COINGECKO_MARKET_PROBE.fetchTimeoutMs),
  });
  if (!res.ok) return null;
  const raw = (await res.json()) as unknown;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  return mapCoinGeckoMarketRow(raw[0] as CoinGeckoMarketRow, coinId);
}

export type CoingeckoMarketResult =
  | { ok: true; cached: boolean; stale?: boolean; fetchedAt: string; data: MarketSnapshot }
  | { ok: false; error: string };

export async function resolveCoingeckoMarket(coinId: string, vs: string, cacheKey: string): Promise<CoingeckoMarketResult> {
  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > now) {
    return {
      ok: true,
      cached: true,
      fetchedAt: new Date(hit.fetchedAt).toISOString(),
      data: hit.value,
    };
  }

  let fresh: MarketSnapshot | null;
  try {
    fresh = await fetchCoingeckoMarketSnapshot(coinId, vs);
  } catch {
    fresh = null;
  }

  if (!fresh) {
    if (hit) {
      return {
        ok: true,
        cached: true,
        stale: true,
        fetchedAt: new Date(hit.fetchedAt).toISOString(),
        data: hit.value,
      };
    }
    return { ok: false, error: 'Upstream unavailable' };
  }

  cache.set(cacheKey, { expiresAt: now + COINGECKO_MARKET_PROBE.cacheTtlMs, value: fresh, fetchedAt: now });
  return { ok: true, cached: false, fetchedAt: new Date(now).toISOString(), data: fresh };
}

export function __resetCoingeckoMarketCacheForTests(): void {
  cache.clear();
}