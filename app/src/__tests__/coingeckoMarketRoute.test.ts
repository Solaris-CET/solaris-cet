// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  __resetCoingeckoMarketCacheForTests,
  clampCoingeckoCoinId,
  clampCoingeckoVsCurrency,
  COINGECKO_MARKET_PATH,
  COINGECKO_MARKET_PROBE,
  coingeckoToNum,
  mapCoinGeckoMarketRow,
  parseCoingeckoMarketQuery,
  resolveCoingeckoMarket,
} from '../../api/lib/coingeckoMarket';

const sampleSnapshot = {
  id: 'the-open-network',
  symbol: 'TON',
  name: 'Toncoin',
  priceUsd: 5.5,
  marketCapUsd: 1_000_000,
  volume24hUsd: 50_000,
  fdvUsd: 2_000_000,
  change24hPct: 1.2,
  lastUpdated: '2026-07-07T12:00:00.000Z',
};

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import coingeckoMarketRoute, { COINGECKO_MARKET_PROBE as routeProbe } from '../../api/market/coingecko/route';

function stubCoingeckoFetch(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      new Response(
        JSON.stringify([
          {
            id: 'the-open-network',
            symbol: 'ton',
            name: 'Toncoin',
            current_price: sampleSnapshot.priceUsd,
            market_cap: sampleSnapshot.marketCapUsd,
            total_volume: sampleSnapshot.volume24hUsd,
            fully_diluted_valuation: sampleSnapshot.fdvUsd,
            price_change_percentage_24h: sampleSnapshot.change24hPct,
            last_updated: sampleSnapshot.lastUpdated,
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    ),
  );
}

function coingeckoRequest(query = '', init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${COINGECKO_MARKET_PATH}${query}`, { ...init, headers });
}

describe('coingeckoMarket helpers', () => {
  afterEach(() => {
    __resetCoingeckoMarketCacheForTests();
  });

  it('exports stable e2e probe contract', () => {
    expect(COINGECKO_MARKET_PROBE.path).toBe('/api/market/coingecko');
    expect(routeProbe.defaultCoinId).toBe('the-open-network');
    expect(routeProbe.authRequired).toBe(false);
  });

  it('clampCoingeckoCoinId and clampCoingeckoVsCurrency sanitize input', () => {
    expect(clampCoingeckoCoinId('TON!!!')).toBe('ton');
    expect(clampCoingeckoVsCurrency('eur')).toBe('eur');
    expect(clampCoingeckoVsCurrency('gbp')).toBe(COINGECKO_MARKET_PROBE.defaultVsCurrency);
  });

  it('parseCoingeckoMarketQuery builds cache key', () => {
    const parsed = parseCoingeckoMarketQuery(new URL('http://test?id=toncoin&vs=eur'));
    expect(parsed.coinId).toBe('toncoin');
    expect(parsed.vs).toBe('eur');
    expect(parsed.cacheKey).toBe('toncoin:eur');
  });

  it('mapCoinGeckoMarketRow maps upstream fields', () => {
    const row = mapCoinGeckoMarketRow(
      {
        id: 'the-open-network',
        symbol: 'ton',
        name: 'Toncoin',
        current_price: '5.5',
        market_cap: 1000,
        total_volume: 200,
        fully_diluted_valuation: 3000,
        price_change_percentage_24h: -1.5,
        last_updated: '2026-07-07T12:00:00.000Z',
      },
      'the-open-network',
    );
    expect(row.symbol).toBe('TON');
    expect(coingeckoToNum('5.5')).toBe(5.5);
    expect(row.priceUsd).toBe(5.5);
  });

  it('resolveCoingeckoMarket returns upstream error when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('fail', { status: 500 })));
    const result = await resolveCoingeckoMarket('the-open-network', 'usd', 'the-open-network:usd');
    expect(result.ok).toBe(false);
    vi.unstubAllGlobals();
  });
});

describe('/api/market/coingecko e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetCoingeckoMarketCacheForTests();
    stubCoingeckoFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(COINGECKO_MARKET_PATH);
    expect(src).toContain('api/market/coingecko/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await coingeckoMarketRoute(coingeckoRequest('', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET returns market snapshot', async () => {
    const res = await coingeckoMarketRoute(coingeckoRequest('?id=the-open-network&vs=usd', { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; source: string; data: { symbol: string } };
    expect(body.ok).toBe(true);
    expect(body.source).toBe('coingecko');
    expect(body.data.symbol).toBe('TON');
  });

  it('POST returns 405', async () => {
    const res = await coingeckoMarketRoute(coingeckoRequest('', { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});