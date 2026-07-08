// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  buildPublicV1WebhookDeliveriesBody,
  parsePublicV1WebhookDeliveriesLimit,
  PUBLIC_V1_WEBHOOK_DELIVERIES_PATH,
  PUBLIC_V1_WEBHOOK_DELIVERIES_PROBE,
} from '../../api/lib/publicV1WebhookDeliveries';

vi.mock('../../api/lib/publicApiAuth', () => ({
  requirePublicApiKey: async () => ({ apiKeyId: 'key-1', userId: 'user-1', apiKeyName: 'test', apiKeyPrefix: 'sk_test' }),
}));

vi.mock('../../api/lib/publicApiMetrics', () => ({
  recordPublicApiUsage: async () => undefined,
}));

vi.mock('../../api/lib/publicApiRateLimit', () => ({
  decideRateLimit: () => ({ ok: true, limit: 120, remaining: 119, reset: Date.now() + 60_000 }),
  rateLimitHeaders: () => ({ 'X-RateLimit-Limit': '120' }),
}));

vi.mock('../../api/lib/publicWebhooksStore', () => ({
  listWebhookDeliveries: async () => [{ id: 'del-1', status: 200 }],
}));

import publicV1WebhookDeliveriesRoute, { PUBLIC_V1_WEBHOOK_DELIVERIES_PROBE as routeProbe } from '../../api/v1/webhooks/deliveries/route';

describe('publicV1WebhookDeliveries helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(PUBLIC_V1_WEBHOOK_DELIVERIES_PROBE.path).toBe('/api/v1/webhooks/deliveries');
    expect(routeProbe.endpointIdParam).toBe('endpointId');
  });

  it('buildPublicV1WebhookDeliveriesBody shapes response', () => {
    expect(parsePublicV1WebhookDeliveriesLimit(null)).toBe(50);
    expect(buildPublicV1WebhookDeliveriesBody([]).version).toBe('v1');
  });
});

describe('/api/v1/webhooks/deliveries e2e probe', () => {
  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(PUBLIC_V1_WEBHOOK_DELIVERIES_PATH);
    expect(src).toContain('api/v1/webhooks/deliveries/route.js');
  });

  it('GET returns deliveries for endpoint', async () => {
    const res = await publicV1WebhookDeliveriesRoute(
      new Request(`http://test${PUBLIC_V1_WEBHOOK_DELIVERIES_PATH}?endpointId=ep-1`, {
        method: 'GET',
        headers: { 'X-API-Key': 'sk_test_key' },
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: Array<{ id: string }> };
    expect(body.items[0]?.id).toBe('del-1');
  });
});