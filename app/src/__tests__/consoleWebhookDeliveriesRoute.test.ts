// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CONSOLE_WEBHOOK_DELIVERIES_PATH,
  CONSOLE_WEBHOOK_DELIVERIES_PROBE,
  parseConsoleWebhookDeliveriesEndpointId,
  parseConsoleWebhookDeliveriesLimit,
} from '../../api/lib/consoleWebhookDeliveries';

const deliveryMocks = vi.hoisted(() => ({
  authOk: true,
  items: [{ id: 'del-1', status: 'success', createdAt: '2026-07-07T10:00:00Z' }],
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!deliveryMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return { user: { id: 'user-1', walletAddress: 'EQabc', role: 'user' }, sid: 'sess-1', mfaEnabled: false };
  },
}));

vi.mock('../../api/lib/publicApiRateLimit', () => ({
  decideRateLimit: () => ({ ok: true, limit: 120, remaining: 119, resetAtEpochSeconds: 1735689600 }),
  rateLimitHeaders: () => ({
    'X-RateLimit-Limit': '120',
    'X-RateLimit-Remaining': '119',
    'X-RateLimit-Reset': '1735689600',
  }),
}));

vi.mock('../../api/lib/publicWebhooksStore', () => ({
  listWebhookDeliveries: async () => deliveryMocks.items,
}));

import consoleWebhookDeliveriesRoute, { CONSOLE_WEBHOOK_DELIVERIES_PROBE as routeProbe } from '../../api/console/webhooks/deliveries/route';

function deliveriesRequest(query = '', init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${CONSOLE_WEBHOOK_DELIVERIES_PATH}${query}`, { ...init, headers });
}

describe('consoleWebhookDeliveries helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(CONSOLE_WEBHOOK_DELIVERIES_PROBE.path).toBe('/api/console/webhooks/deliveries');
    expect(routeProbe.defaultLimit).toBe(50);
    expect(routeProbe.methods).toEqual(['GET', 'OPTIONS']);
  });

  it('parseConsoleWebhookDeliveriesEndpointId and limit', () => {
    const params = new URLSearchParams('endpointId=wh-1&limit=25');
    expect(parseConsoleWebhookDeliveriesEndpointId(params)).toBe('wh-1');
    expect(parseConsoleWebhookDeliveriesLimit(params)).toBe(25);
    expect(parseConsoleWebhookDeliveriesLimit(new URLSearchParams())).toBe(50);
  });
});

describe('/api/console/webhooks/deliveries e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deliveryMocks.authOk = true;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(CONSOLE_WEBHOOK_DELIVERIES_PATH);
    expect(src).toContain('api/console/webhooks/deliveries/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await consoleWebhookDeliveriesRoute(deliveriesRequest('', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET without endpointId returns 400', async () => {
    const res = await consoleWebhookDeliveriesRoute(
      deliveriesRequest('', { method: 'GET', headers: { Authorization: 'Bearer valid-token' } }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { message: string } };
    expect(body.error.message).toBe(CONSOLE_WEBHOOK_DELIVERIES_PROBE.missingEndpointIdError);
  });

  it('GET returns delivery items', async () => {
    const res = await consoleWebhookDeliveriesRoute(
      deliveriesRequest('?endpointId=wh-1', { method: 'GET', headers: { Authorization: 'Bearer valid-token' } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: Array<{ id: string }> };
    expect(body.items).toHaveLength(1);
  });

  it('POST returns 405', async () => {
    const res = await consoleWebhookDeliveriesRoute(
      deliveriesRequest('?endpointId=wh-1', { method: 'POST', headers: { Authorization: 'Bearer valid-token' } }),
    );
    expect(res.status).toBe(405);
  });
});