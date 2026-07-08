// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildPublicV2PriceBody, PUBLIC_V2_PRICE_PATH, PUBLIC_V2_PRICE_PROBE } from '../../api/lib/publicV2Price';

vi.mock('../../api/lib/publicApiAuth', () => ({
  requirePublicApiKey: async (req: Request) => {
    if (!req.headers.get('X-API-Key')) return new Response(JSON.stringify({ error: { code: 'unauthorized' } }), { status: 401 });
    return { apiKeyId: 'key-1', userId: 'user-1', apiKeyName: 'test', apiKeyPrefix: 'sk_test' };
  },
}));

vi.mock('../../api/lib/publicApiMetrics', () => ({
  recordPublicApiUsage: async () => undefined,
}));

vi.mock('../../api/lib/publicApiRateLimit', () => ({
  decideRateLimit: () => ({ ok: true, limit: 180, remaining: 179, reset: Date.now() + 60_000 }),
  rateLimitHeaders: () => ({ 'X-RateLimit-Limit': '180' }),
}));

import publicV2PriceRoute, { PUBLIC_V2_PRICE_PROBE as routeProbe } from '../../api/v2/price/route';

describe('publicV2Price helpers', () => {
  afterEach(() => {
    delete process.env.CET_PRICE_USD;
  });

  it('exports stable e2e probe contract', () => {
    expect(PUBLIC_V2_PRICE_PROBE.path).toBe('/api/v2/price');
    expect(routeProbe.assetChain).toBe('TON');
  });

  it('buildPublicV2PriceBody nests asset and price', () => {
    const body = buildPublicV2PriceBody(3.14);
    expect(body.asset.symbol).toBe('CET');
    expect(body.price.usd).toBe(3.14);
  });
});

describe('/api/v2/price e2e probe', () => {
  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(PUBLIC_V2_PRICE_PATH);
    expect(src).toContain('api/v2/price/route.js');
  });

  it('GET returns v2 price payload', async () => {
    process.env.CET_PRICE_USD = '1.1';
    const res = await publicV2PriceRoute(
      new Request(`http://test${PUBLIC_V2_PRICE_PATH}`, { method: 'GET', headers: { 'X-API-Key': 'sk_test_key' } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { version: string; price: { usd: number } };
    expect(body.version).toBe('v2');
    expect(body.price.usd).toBe(1.1);
  });
});