// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  isInternalPushAuthorized,
  parsePushNotifyAdminBody,
  PUSH_NOTIFY_ADMIN_PATH,
  PUSH_NOTIFY_ADMIN_PROBE,
  readInternalPushToken,
} from '../../api/lib/pushNotifyAdmin';

const pushMocks = vi.hoisted(() => {
  const schema = {
    pushSubscriptions: { endpoint: 'pushSubscriptions.endpoint', userId: 'pushSubscriptions.userId' },
    users: { id: 'users.id', role: 'users.role' },
  };

  const bag = {
    subscriptions: [{ endpoint: 'https://push.example/1', p256dh: 'key', auth: 'auth' }],
    pushCalls: 0,
  };

  const getDb = () => ({
    select() {
      return {
        from() {
          return {
            innerJoin() {
              return {
                where() {
                  return {
                    limit: async () => bag.subscriptions,
                  };
                },
              };
            },
          };
        },
      };
    },
  });

  return Object.assign(bag, { schema, getDb });
});

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
}));

vi.mock('../../api/lib/webPush', () => ({
  sendWebPush: vi.fn(async () => {
    pushMocks.pushCalls += 1;
  }),
}));

vi.mock('../../db/client', () => ({
  getDb: pushMocks.getDb,
  schema: pushMocks.schema,
}));

import pushNotifyAdminRoute, { PUSH_NOTIFY_ADMIN_PROBE as routeProbe } from '../../api/push/notify-admin/route';

const PUSH_TOKEN = 'internal-push-token';

function notifyRequest(body: unknown, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${PUSH_TOKEN}`);
  headers.set('Content-Type', 'application/json');
  return new Request(`http://test${PUSH_NOTIFY_ADMIN_PATH}`, {
    method: 'POST',
    ...init,
    headers,
    body: JSON.stringify(body),
  });
}

describe('pushNotifyAdmin helpers', () => {
  beforeEach(() => {
    process.env.INTERNAL_PUSH_TOKEN = PUSH_TOKEN;
  });

  afterEach(() => {
    delete process.env.INTERNAL_PUSH_TOKEN;
  });

  it('exports stable e2e probe contract', () => {
    expect(PUSH_NOTIFY_ADMIN_PROBE.path).toBe('/api/push/notify-admin');
    expect(routeProbe.rateLimitKey).toBe('push_notify_admin');
    expect(routeProbe.adminRole).toBe('admin');
  });

  it('parsePushNotifyAdminBody normalizes payload', () => {
    expect(parsePushNotifyAdminBody({ title: ' Lead nou ', body: 'Detalii', data: { leadId: '1' } })).toEqual({
      title: 'Lead nou',
      body: 'Detalii',
      data: { leadId: '1' },
    });
    expect(parsePushNotifyAdminBody({})).toEqual({
      title: PUSH_NOTIFY_ADMIN_PROBE.defaultTitle,
      body: '',
      data: {},
    });
  });

  it('isInternalPushAuthorized validates bearer token', () => {
    const req = new Request('http://test', { headers: { Authorization: `Bearer ${PUSH_TOKEN}` } });
    expect(isInternalPushAuthorized(req, PUSH_TOKEN)).toBe(true);
    expect(readInternalPushToken()).toBe(PUSH_TOKEN);
    expect(isInternalPushAuthorized(req, 'other')).toBe(false);
  });
});

describe('/api/push/notify-admin e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pushMocks.pushCalls = 0;
    process.env.INTERNAL_PUSH_TOKEN = PUSH_TOKEN;
  });

  afterEach(() => {
    delete process.env.INTERNAL_PUSH_TOKEN;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(PUSH_NOTIFY_ADMIN_PATH);
    expect(src).toContain('api/push/notify-admin/route.js');
  });

  it('POST without token returns 403', async () => {
    const res = await pushNotifyAdminRoute(
      new Request(`http://test${PUSH_NOTIFY_ADMIN_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test' }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it('POST delivers admin push notifications', async () => {
    const res = await pushNotifyAdminRoute(
      notifyRequest({ title: 'Lead nou', body: 'Cerere contact', data: { leadId: 'lead-1' } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; delivered: number };
    expect(body.success).toBe(true);
    expect(body.delivered).toBe(1);
    expect(pushMocks.pushCalls).toBe(1);
  });

  it('GET returns 405', async () => {
    const res = await pushNotifyAdminRoute(
      new Request(`http://test${PUSH_NOTIFY_ADMIN_PATH}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${PUSH_TOKEN}` },
      }),
    );
    expect(res.status).toBe(405);
  });
});