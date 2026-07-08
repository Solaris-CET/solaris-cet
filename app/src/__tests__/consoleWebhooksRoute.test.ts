// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CONSOLE_WEBHOOKS_PATH,
  CONSOLE_WEBHOOKS_PROBE,
  consoleWebhookCreateSchema,
  parseConsoleWebhooksDeleteId,
} from '../../api/lib/consoleWebhooks';

const webhookMocks = vi.hoisted(() => ({
  authOk: true,
  items: [{ id: 'wh-1', url: 'https://example.com/hook', events: ['order.created'], enabled: true }],
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!webhookMocks.authOk || !auth.startsWith('Bearer valid-token')) {
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
  listWebhookEndpoints: async () => webhookMocks.items,
  createWebhookEndpoint: async () => ({
    endpoint: { id: 'wh-new', url: 'https://example.com/new', events: [], enabled: true },
    secret: 'whsec_test',
  }),
  deleteWebhookEndpoint: async () => true,
}));

import consoleWebhooksRoute, { CONSOLE_WEBHOOKS_PROBE as routeProbe } from '../../api/console/webhooks/route';

function webhooksRequest(query = '', init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${CONSOLE_WEBHOOKS_PATH}${query}`, { ...init, headers });
}

describe('consoleWebhooks helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(CONSOLE_WEBHOOKS_PROBE.path).toBe('/api/console/webhooks');
    expect(routeProbe.rateLimitBucket).toBe('console-webhooks');
    expect(routeProbe.maxEvents).toBe(50);
  });

  it('consoleWebhookCreateSchema validates url', () => {
    expect(consoleWebhookCreateSchema.safeParse({ url: 'https://example.com/hook' }).success).toBe(true);
    expect(consoleWebhookCreateSchema.safeParse({ url: 'not-a-url' }).success).toBe(false);
  });

  it('parseConsoleWebhooksDeleteId reads id param', () => {
    expect(parseConsoleWebhooksDeleteId(new URLSearchParams('id=wh-1'))).toBe('wh-1');
  });
});

describe('/api/console/webhooks e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    webhookMocks.authOk = true;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(CONSOLE_WEBHOOKS_PATH);
    expect(src).toContain('api/console/webhooks/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await consoleWebhooksRoute(webhooksRequest('', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET lists webhook endpoints', async () => {
    const res = await consoleWebhooksRoute(
      webhooksRequest('', { method: 'GET', headers: { Authorization: 'Bearer valid-token' } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: Array<{ id: string }> };
    expect(body.items).toHaveLength(1);
  });

  it('POST creates webhook endpoint', async () => {
    const res = await consoleWebhooksRoute(
      webhooksRequest('', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ url: 'https://example.com/new', events: ['ping'] }),
      }),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { secret: string };
    expect(body.secret).toBe('whsec_test');
  });

  it('DELETE removes webhook endpoint', async () => {
    const res = await consoleWebhooksRoute(
      webhooksRequest('?id=wh-1', { method: 'DELETE', headers: { Authorization: 'Bearer valid-token' } }),
    );
    expect(res.status).toBe(204);
  });
});