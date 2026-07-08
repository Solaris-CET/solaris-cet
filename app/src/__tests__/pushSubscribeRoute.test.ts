// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { parsePushSubscribeBody, PUSH_SUBSCRIBE_PATH, PUSH_SUBSCRIBE_PROBE } from '../../api/lib/pushSubscribe';

const subscribeMocks = vi.hoisted(() => ({
  user: { id: 'user-1', walletAddress: 'EQabc', role: 'user' } as { id: string; walletAddress: string; role: string } | null,
  subscriptionSaved: false,
  preferencesSaved: false,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/authUser', () => ({
  requireUser: async () => subscribeMocks.user,
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    insert() {
      return {
        values() {
          return {
            onConflictDoUpdate: async () => {
              if (!subscribeMocks.subscriptionSaved) subscribeMocks.subscriptionSaved = true;
              else subscribeMocks.preferencesSaved = true;
            },
          };
        },
      };
    },
  }),
  schema: {
    pushSubscriptions: { endpoint: 'pushSubscriptions.endpoint' },
    notificationPreferences: { userId: 'notificationPreferences.userId' },
  },
}));

import pushSubscribeRoute, { PUSH_SUBSCRIBE_PROBE as routeProbe } from '../../api/push/subscribe/route';

const validSubscription = {
  endpoint: 'https://push.example/sub/1',
  keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
};

function subscribeRequest(body: unknown, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  headers.set('Content-Type', 'application/json');
  return new Request(`http://test${PUSH_SUBSCRIBE_PATH}`, {
    method: 'POST',
    ...init,
    headers,
    body: JSON.stringify(body),
  });
}

describe('pushSubscribe helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(PUSH_SUBSCRIBE_PROBE.path).toBe('/api/push/subscribe');
    expect(routeProbe.authRequired).toBe(true);
  });

  it('parsePushSubscribeBody validates keys', () => {
    expect(parsePushSubscribeBody(validSubscription)).toEqual({
      endpoint: 'https://push.example/sub/1',
      p256dh: 'p256dh-key',
      auth: 'auth-key',
    });
    expect(parsePushSubscribeBody({ endpoint: 'x' })).toBeNull();
  });
});

describe('/api/push/subscribe e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    subscribeMocks.user = { id: 'user-1', walletAddress: 'EQabc', role: 'user' };
    subscribeMocks.subscriptionSaved = false;
    subscribeMocks.preferencesSaved = false;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(PUSH_SUBSCRIBE_PATH);
    expect(src).toContain('api/push/subscribe/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await pushSubscribeRoute(
      new Request(`http://test${PUSH_SUBSCRIBE_PATH}`, { method: 'OPTIONS', headers: { origin: 'https://allowed.test' } }),
    );
    expect(res.status).toBe(204);
  });

  it('POST without auth returns 401', async () => {
    subscribeMocks.user = null;
    const res = await pushSubscribeRoute(subscribeRequest(validSubscription));
    expect(res.status).toBe(401);
  });

  it('POST stores subscription and preferences', async () => {
    const res = await pushSubscribeRoute(subscribeRequest(validSubscription));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    expect(subscribeMocks.subscriptionSaved).toBe(true);
    expect(subscribeMocks.preferencesSaved).toBe(true);
  });
});