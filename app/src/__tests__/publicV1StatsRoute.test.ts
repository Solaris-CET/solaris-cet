// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { buildPublicV1StatsBody, PUBLIC_V1_STATS_PATH, PUBLIC_V1_STATS_PROBE } from '../../api/lib/publicV1Stats';

vi.mock('../../api/lib/publicApiAuth', () => ({
  requirePublicApiKey: async (req: Request) => {
    if (!req.headers.get('X-API-Key')) return new Response(JSON.stringify({ error: { code: 'unauthorized' } }), { status: 401 });
    return { apiKeyId: 'key-1', userId: 'user-1', apiKeyName: 'test', apiKeyPrefix: 'sk_test' };
  },
}));

vi.mock('../../api/lib/publicApiMetrics', () => ({
  recordPublicApiUsage: async () => undefined,
  aggregatePublicApiUsage: () => ({ total: 3, byStatus: { '200': 3 } }),
}));

vi.mock('../../api/lib/publicApiRateLimit', () => ({
  decideRateLimit: () => ({ ok: true, limit: 60, remaining: 59, reset: Date.now() + 60_000 }),
  rateLimitHeaders: () => ({ 'X-RateLimit-Limit': '60' }),
}));

import publicV1StatsRoute, { PUBLIC_V1_STATS_PROBE as routeProbe } from '../../api/v1/stats/route';

function statsRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('X-API-Key', 'sk_test_key');
  return new Request(`http://test${PUBLIC_V1_STATS_PATH}`, { method: 'GET', ...init, headers });
}

describe('publicV1Stats helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(PUBLIC_V1_STATS_PROBE.path).toBe('/api/v1/stats');
    expect(routeProbe.pathPrefix).toBe('/api/v1/');
  });

  it('buildPublicV1StatsBody includes api key usage', () => {
    const body = buildPublicV1StatsBody('key-1', Date.parse('2026-07-07T12:00:00.000Z'));
    expect(body.version).toBe('v1');
    expect(body.apiKey.id).toBe('key-1');
  });
});

describe('/api/v1/stats e2e probe', () => {
  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(PUBLIC_V1_STATS_PATH);
    expect(src).toContain('api/v1/stats/route.js');
  });

  it('GET returns v1 stats payload', async () => {
    const res = await publicV1StatsRoute(statsRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { version: string; global: { total: number } };
    expect(body.version).toBe('v1');
    expect(body.global.total).toBe(3);
  });
});