// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { parsePushUnsubscribeEndpoint, PUSH_UNSUBSCRIBE_PATH, PUSH_UNSUBSCRIBE_PROBE } from '../../api/lib/pushUnsubscribe';

const unsubscribeMocks = vi.hoisted(() => ({
  user: { id: 'user-1', walletAddress: 'EQabc', role: 'user' } as { id: string; walletAddress: string; role: string } | null,
  deleted: false,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/authUser', () => ({
  requireUser: async () => unsubscribeMocks.user,
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    delete() {
      return {
        where: async () => {
          unsubscribeMocks.deleted = true;
        },
      };
    },
  }),
  schema: {
    pushSubscriptions: { userId: 'pushSubscriptions.userId', endpoint: 'pushSubscriptions.endpoint' },
  },
}));

import pushUnsubscribeRoute, { PUSH_UNSUBSCRIBE_PROBE as routeProbe } from '../../api/push/unsubscribe/route';

function unsubscribeRequest(body: unknown, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  headers.set('Content-Type', 'application/json');
  return new Request(`http://test${PUSH_UNSUBSCRIBE_PATH}`, {
    method: 'POST',
    ...init,
    headers,
    body: JSON.stringify(body),
  });
}

describe('pushUnsubscribe helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(PUSH_UNSUBSCRIBE_PROBE.path).toBe('/api/push/unsubscribe');
    expect(routeProbe.missingEndpointError).toBe('Missing endpoint');
  });

  it('parsePushUnsubscribeEndpoint trims endpoint', () => {
    expect(parsePushUnsubscribeEndpoint({ endpoint: ' https://push.example/1 ' })).toBe('https://push.example/1');
    expect(parsePushUnsubscribeEndpoint({})).toBeNull();
  });
});

describe('/api/push/unsubscribe e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    unsubscribeMocks.user = { id: 'user-1', walletAddress: 'EQabc', role: 'user' };
    unsubscribeMocks.deleted = false;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(PUSH_UNSUBSCRIBE_PATH);
    expect(src).toContain('api/push/unsubscribe/route.js');
  });

  it('POST removes subscription endpoint', async () => {
    const res = await pushUnsubscribeRoute(unsubscribeRequest({ endpoint: 'https://push.example/1' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    expect(unsubscribeMocks.deleted).toBe(true);
  });

  it('POST missing endpoint returns 400', async () => {
    const res = await pushUnsubscribeRoute(unsubscribeRequest({}));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(PUSH_UNSUBSCRIBE_PROBE.missingEndpointError);
  });
});