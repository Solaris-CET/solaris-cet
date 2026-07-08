// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildPublicV1PriceBody, PUBLIC_V1_PRICE_PATH, PUBLIC_V1_PRICE_PROBE, resolveCetPriceUsdFromEnv } from '../../api/lib/publicV1Price';

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
  decideRateLimit: () => ({ ok: true, limit: 120, remaining: 119, reset: Date.now() + 60_000 }),
  rateLimitHeaders: () => ({ 'X-RateLimit-Limit': '120' }),
}));

import publicV1PriceRoute, { PUBLIC_V1_PRICE_PROBE as routeProbe } from '../../api/v1/price/route';

function priceRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('X-API-Key', 'sk_test_key');
  return new Request(`http://test${PUBLIC_V1_PRICE_PATH}`, { method: 'GET', ...init, headers });
}

describe('publicV1Price helpers', () => {
  afterEach(() => {
    delete process.env.CET_PRICE_USD;
  });

  it('exports stable e2e probe contract', () => {
    expect(PUBLIC_V1_PRICE_PROBE.path).toBe('/api/v1/price');
    expect(routeProbe.asset).toBe('CET');
  });

  it('resolveCetPriceUsdFromEnv reads env', () => {
    expect(resolveCetPriceUsdFromEnv({ CET_PRICE_USD: '1.25' })).toBe(1.25);
    expect(buildPublicV1PriceBody(1.25).priceUsd).toBe(1.25);
  });
});

describe('/api/v1/price e2e probe', () => {
  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(PUBLIC_V1_PRICE_PATH);
    expect(src).toContain('api/v1/price/route.js');
  });

  it('GET without API key returns 401', async () => {
    const res = await publicV1PriceRoute(new Request(`http://test${PUBLIC_V1_PRICE_PATH}`, { method: 'GET' }));
    expect(res.status).toBe(401);
  });

  it('GET returns v1 price payload', async () => {
    process.env.CET_PRICE_USD = '2.5';
    const res = await publicV1PriceRoute(priceRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { version: string; priceUsd: number };
    expect(body.version).toBe('v1');
    expect(body.priceUsd).toBe(2.5);
  });
});