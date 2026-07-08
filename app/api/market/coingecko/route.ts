import {
  COINGECKO_MARKET_PROBE,
  parseCoingeckoMarketQuery,
  resolveCoingeckoMarket,
} from '../../lib/coingeckoMarket';
import { corsJson, corsOptions } from '@/api/lib/http';

export { COINGECKO_MARKET_PATH, COINGECKO_MARKET_PROBE } from '@/api/lib/coingeckoMarket';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, COINGECKO_MARKET_PROBE.methods.join(', '));
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const { coinId, vs, cacheKey } = parseCoingeckoMarketQuery(new URL(req.url));
  const result = await resolveCoingeckoMarket(coinId, vs, cacheKey);

  if (!result.ok) {
    return corsJson(req, COINGECKO_MARKET_PROBE.upstreamUnavailableStatus, {
      ok: false,
      error: result.error,
      source: 'coingecko',
    });
  }

  const cacheHeader = result.stale ? 'public, max-age=10' : 'public, max-age=20';
  return corsJson(
    req,
    200,
    {
      ok: true,
      source: 'coingecko',
      cached: result.cached,
      ...(result.stale ? { stale: true } : {}),
      fetchedAt: result.fetchedAt,
      data: result.data,
    },
    { 'Cache-Control': cacheHeader },
  );
}