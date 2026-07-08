// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  buildPublicV1WebhooksListBody,
  PUBLIC_V1_WEBHOOKS_PATH,
  PUBLIC_V1_WEBHOOKS_PROBE,
  publicV1WebhookCreateSchema,
} from '../../api/lib/publicV1Webhooks';

vi.mock('../../api/lib/publicApiAuth', () => ({
  requirePublicApiKey: async () => ({ apiKeyId: 'key-1', userId: 'user-1', apiKeyName: 'test', apiKeyPrefix: 'sk_test' }),
}));

vi.mock('../../api/lib/publicApiMetrics', () => ({
  recordPublicApiUsage: async () => undefined,
}));

vi.mock('../../api/lib/publicApiRateLimit', () => ({
  decideRateLimit: () => ({ ok: true, limit: 60, remaining: 59, reset: Date.now() + 60_000 }),
  rateLimitHeaders: () => ({ 'X-RateLimit-Limit': '60' }),
}));

vi.mock('../../api/lib/publicWebhooksStore', () => ({
  listWebhookEndpoints: async () => [{ id: 'ep-1', url: 'https://hooks.test' }],
  createWebhookEndpoint: async () => ({ endpoint: { id: 'ep-new' }, secret: 'sec' }),
  deleteWebhookEndpoint: async () => true,
}));

import publicV1WebhooksRoute, { PUBLIC_V1_WEBHOOKS_PROBE as routeProbe } from '../../api/v1/webhooks/route';

describe('publicV1Webhooks helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(PUBLIC_V1_WEBHOOKS_PROBE.path).toBe('/api/v1/webhooks');
    expect(routeProbe.notConfiguredCode).toBe('not_configured');
  });

  it('publicV1WebhookCreateSchema validates url', () => {
    expect(publicV1WebhookCreateSchema.safeParse({ url: 'https://hooks.test' }).success).toBe(true);
    expect(buildPublicV1WebhooksListBody([]).version).toBe('v1');
  });
});

describe('/api/v1/webhooks e2e probe', () => {
  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(PUBLIC_V1_WEBHOOKS_PATH);
    expect(src).toContain('api/v1/webhooks/route.js');
  });

  it('GET lists webhook endpoints', async () => {
    const res = await publicV1WebhooksRoute(
      new Request(`http://test${PUBLIC_V1_WEBHOOKS_PATH}`, { method: 'GET', headers: { 'X-API-Key': 'sk_test_key' } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: Array<{ id: string }> };
    expect(body.items[0]?.id).toBe('ep-1');
  });
});