// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ADMIN_LOGOUT_PATH, ADMIN_LOGOUT_PROBE } from '../../api/lib/adminLogout';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  revokeCalls: 0,
  revokedSessionId: null as string | null,
}));

vi.mock('../../api/lib/adminAudit', () => ({
  writeAdminAudit: vi.fn(async () => undefined),
}));

vi.mock('../../api/lib/adminAuth', () => ({
  requireAdminAuth: async () => {
    if (!adminMocks.authOk) return { status: 401, error: 'Unauthorized' };
    return { admin: { id: 'admin_1', role: 'admin' }, sessionId: 'sess_1' };
  },
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    update() {
      return {
        set() {
          return {
            where: async (_clause: unknown) => {
              adminMocks.revokeCalls += 1;
              adminMocks.revokedSessionId = 'sess_1';
            },
          };
        },
      };
    },
  }),
  schema: {
    adminSessions: { id: 'adminSessions.id' },
  },
}));

import adminLogoutRoute, { ADMIN_LOGOUT_PROBE as routeProbe } from '../../api/admin/logout/route';
import { writeAdminAudit } from '../../api/lib/adminAudit';

describe('adminLogout helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(ADMIN_LOGOUT_PROBE.path).toBe('/api/admin/logout');
    expect(routeProbe.authRequired).toBe(true);
    expect(routeProbe.auditAction).toBe('ADMIN_LOGOUT');
    expect(routeProbe.unauthenticatedStatus).toBe(401);
    expect(routeProbe.methods).toEqual(['POST', 'OPTIONS']);
  });
});

describe('/api/admin/logout e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.revokeCalls = 0;
    adminMocks.revokedSessionId = null;
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_LOGOUT_PATH);
    expect(src).toContain('api/admin/logout/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminLogoutRoute(
      new Request(`http://test${ADMIN_LOGOUT_PATH}`, { method: 'OPTIONS' }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('POST requires admin auth', async () => {
    adminMocks.authOk = false;
    const res = await adminLogoutRoute(adminRequest(ADMIN_LOGOUT_PATH, { method: 'POST' }));
    expect(res.status).toBe(ADMIN_LOGOUT_PROBE.unauthenticatedStatus);
  });

  it('POST revokes session and writes ADMIN_LOGOUT audit', async () => {
    const res = await adminLogoutRoute(adminRequest(ADMIN_LOGOUT_PATH, { method: 'POST' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    expect(adminMocks.revokeCalls).toBe(1);
    expect(adminMocks.revokedSessionId).toBe('sess_1');
    expect(writeAdminAudit).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({
        admin: expect.objectContaining({ id: 'admin_1' }),
        sessionId: 'sess_1',
      }),
      'ADMIN_LOGOUT',
      'admin_session',
      'sess_1',
    );
  });

  it('GET returns 405', async () => {
    const res = await adminLogoutRoute(adminRequest(ADMIN_LOGOUT_PATH, { method: 'GET' }));
    expect(res.status).toBe(405);
  });
});