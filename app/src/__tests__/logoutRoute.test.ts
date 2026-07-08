// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LOGOUT_PATH, LOGOUT_PROBE } from '../../api/lib/logout';

const logoutMocks = vi.hoisted(() => ({
  authOk: true,
  sid: 'sess-1' as string | null,
  revokeCalls: 0,
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!logoutMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return { user: { id: 'user-1', walletAddress: 'EQabc', role: 'user' }, sid: logoutMocks.sid, mfaEnabled: false };
  },
}));

vi.mock('../../api/lib/originGuard', () => ({
  ensureAllowedOrigin: () => ({ allowedOrigin: 'https://allowed.test' }),
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    update() {
      return {
        set() {
          return {
            where: async () => {
              logoutMocks.revokeCalls += 1;
            },
          };
        },
      };
    },
  }),
  schema: {
    sessions: { id: 'sessions.id', revokedAt: 'sessions.revokedAt' },
  },
}));

import logoutRoute, { LOGOUT_PROBE as routeProbe } from '../../api/logout/route';

function logoutRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  headers.set('Authorization', 'Bearer valid-token');
  return new Request(`http://test${LOGOUT_PATH}`, { ...init, headers });
}

describe('logout helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(LOGOUT_PROBE.path).toBe('/api/logout');
    expect(routeProbe.authRequired).toBe(true);
    expect(routeProbe.unauthenticatedStatus).toBe(401);
  });
});

describe('/api/logout e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    logoutMocks.authOk = true;
    logoutMocks.sid = 'sess-1';
    logoutMocks.revokeCalls = 0;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(LOGOUT_PATH);
    expect(src).toContain('api/logout/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await logoutRoute(logoutRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('POST without auth returns 401', async () => {
    logoutMocks.authOk = false;
    const res = await logoutRoute(logoutRequest({ method: 'POST' }));
    expect(res.status).toBe(401);
  });

  it('POST revokes session', async () => {
    const res = await logoutRoute(logoutRequest({ method: 'POST' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    expect(logoutMocks.revokeCalls).toBe(1);
  });

  it('POST without sid skips revoke', async () => {
    logoutMocks.sid = null;
    const res = await logoutRoute(logoutRequest({ method: 'POST' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    expect(logoutMocks.revokeCalls).toBe(0);
  });
});