// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { buildPublicV2StatsBody, PUBLIC_V2_STATS_PATH, PUBLIC_V2_STATS_PROBE } from '../../api/lib/publicV2Stats';

vi.mock('../../api/lib/publicApiAuth', () => ({
  requirePublicApiKey: async () => ({ apiKeyId: 'key-1', userId: 'user-1', apiKeyName: 'test', apiKeyPrefix: 'sk_test' }),
}));

vi.mock('../../api/lib/publicApiMetrics', () => ({
  recordPublicApiUsage: async () => undefined,
  aggregatePublicApiUsage: () => ({ total: 7, byStatus: { '200': 7 } }),
}));

vi.mock('../../api/lib/publicApiRateLimit', () => ({
  decideRateLimit: () => ({ ok: true, limit: 60, remaining: 59, reset: Date.now() + 60_000 }),
  rateLimitHeaders: () => ({ 'X-RateLimit-Limit': '60' }),
}));

import publicV2StatsRoute, { PUBLIC_V2_STATS_PROBE as routeProbe } from '../../api/v2/stats/route';

describe('publicV2Stats helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(PUBLIC_V2_STATS_PROBE.path).toBe('/api/v2/stats');
    expect(routeProbe.pathPrefix).toBe('/api/v2/');
  });

  it('buildPublicV2StatsBody nests usage by api key', () => {
    const body = buildPublicV2StatsBody('key-1', Date.parse('2026-07-07T12:00:00.000Z'));
    expect(body.version).toBe('v2');
    expect(body.usage.byApiKey[0]?.apiKeyId).toBe('key-1');
  });
});

describe('/api/v2/stats e2e probe', () => {
  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(PUBLIC_V2_STATS_PATH);
    expect(src).toContain('api/v2/stats/route.js');
  });

  it('GET returns v2 stats payload', async () => {
    const res = await publicV2StatsRoute(
      new Request(`http://test${PUBLIC_V2_STATS_PATH}`, { method: 'GET', headers: { 'X-API-Key': 'sk_test_key' } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { version: string; usage: { global: { total: number } } };
    expect(body.version).toBe('v2');
    expect(body.usage.global.total).toBe(7);
  });
});