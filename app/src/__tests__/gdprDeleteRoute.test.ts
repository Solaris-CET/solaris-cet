// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GDPR_DELETE_PATH, GDPR_DELETE_PROBE } from '../../api/lib/gdprDelete';

const deleteMocks = vi.hoisted(() => ({
  authOk: true,
  userDeleted: false,
  anonymizeCalls: 0,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!deleteMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return { user: { id: 'user-1', walletAddress: 'EQabc', role: 'user' }, sid: 'sess-1', mfaEnabled: false };
  },
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    update() {
      return {
        set() {
          return {
            where: async () => {
              deleteMocks.anonymizeCalls += 1;
            },
          };
        },
      };
    },
    delete() {
      return {
        where: async () => {
          deleteMocks.userDeleted = true;
        },
      };
    },
  }),
  schema: {
    aiQueryLogs: { userId: 'aiQueryLogs.userId' },
    analyticsEvents: { userId: 'analyticsEvents.userId' },
    users: { id: 'users.id' },
  },
}));

import gdprDeleteRoute, { GDPR_DELETE_PROBE as routeProbe } from '../../api/gdpr/route';

function deleteRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${GDPR_DELETE_PATH}`, { ...init, headers });
}

describe('gdprDelete helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(GDPR_DELETE_PROBE.path).toBe('/api/gdpr');
    expect(routeProbe.authRequired).toBe(true);
    expect(routeProbe.rateLimitKey).toBe('gdpr_delete');
  });
});

describe('/api/gdpr e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteMocks.authOk = true;
    deleteMocks.userDeleted = false;
    deleteMocks.anonymizeCalls = 0;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(GDPR_DELETE_PATH);
    expect(src).toContain('api/gdpr/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await gdprDeleteRoute(deleteRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('DELETE without auth returns 401', async () => {
    deleteMocks.authOk = false;
    const res = await gdprDeleteRoute(deleteRequest({ method: 'DELETE' }));
    expect(res.status).toBe(401);
  });

  it('DELETE anonymizes and removes user', async () => {
    const res = await gdprDeleteRoute(
      deleteRequest({ method: 'DELETE', headers: { Authorization: 'Bearer valid-token' } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);
    expect(deleteMocks.anonymizeCalls).toBeGreaterThanOrEqual(2);
    expect(deleteMocks.userDeleted).toBe(true);
  });
});