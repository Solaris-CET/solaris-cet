// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildPushTestNotification, PUSH_TEST_PATH, PUSH_TEST_PROBE } from '../../api/lib/pushTest';

const testMocks = vi.hoisted(() => ({
  user: { id: 'user-1', walletAddress: 'EQabc', role: 'user' } as { id: string; walletAddress: string; role: string } | null,
  subscriptions: [] as Array<{ endpoint: string; p256dh: string; auth: string }>,
  pushCalls: 0,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/authUser', () => ({
  requireUser: async () => testMocks.user,
}));

vi.mock('../../api/lib/webPush', () => ({
  sendWebPush: vi.fn(async () => {
    testMocks.pushCalls += 1;
  }),
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from() {
          return {
            where() {
              return {
                limit: async () => testMocks.subscriptions,
              };
            },
          };
        },
      };
    },
  }),
  schema: {
    pushSubscriptions: { userId: 'pushSubscriptions.userId' },
  },
}));

import pushTestRoute, { PUSH_TEST_PROBE as routeProbe } from '../../api/push/test/route';

function pushTestRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${PUSH_TEST_PATH}`, { method: 'POST', ...init, headers });
}

describe('pushTest helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(PUSH_TEST_PROBE.path).toBe('/api/push/test');
    expect(routeProbe.subscriptionLimit).toBe(5);
    expect(routeProbe.authRequired).toBe(true);
  });

  it('buildPushTestNotification returns stable payload', () => {
    expect(buildPushTestNotification()).toEqual({
      title: PUSH_TEST_PROBE.title,
      body: PUSH_TEST_PROBE.body,
      url: PUSH_TEST_PROBE.url,
    });
  });
});

describe('/api/push/test e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testMocks.user = { id: 'user-1', walletAddress: 'EQabc', role: 'user' };
    testMocks.subscriptions = [{ endpoint: 'https://push.example/1', p256dh: 'key', auth: 'auth' }];
    testMocks.pushCalls = 0;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(PUSH_TEST_PATH);
    expect(src).toContain('api/push/test/route.js');
  });

  it('POST delivers test notification', async () => {
    const res = await pushTestRoute(pushTestRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; delivered: number };
    expect(body.ok).toBe(true);
    expect(body.delivered).toBe(1);
    expect(testMocks.pushCalls).toBe(1);
  });

  it('POST without subscriptions returns delivered 0', async () => {
    testMocks.subscriptions = [];
    const res = await pushTestRoute(pushTestRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { delivered: number };
    expect(body.delivered).toBe(0);
  });
});