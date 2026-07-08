// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_USERS_PATH,
  ADMIN_USERS_PROBE,
  parseAdminUserDeleteId,
  parseAdminUsersQuery,
} from '../../api/lib/adminUsers';

const usersMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'admin' as 'admin' | 'editor' | 'viewer',
  users: [
    {
      id: 'user-1',
      walletAddress: 'EQabc123',
      role: 'user',
      points: 10,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      displayName: 'Ion',
      email: 'ion@test.com',
    },
  ],
  deleteId: '',
  deleted: false,
}));

vi.mock('../../api/lib/adminAudit', () => ({
  writeAdminAudit: vi.fn(async () => undefined),
}));

vi.mock('../../api/lib/adminAuth', () => ({
  guardAdminRoute: async (req: Request, probe: {
    minRole: string | ((method: string) => string);
    unauthenticatedStatus?: number;
    unauthorizedError?: string;
    forbiddenStatus?: number;
    forbiddenError?: string;
  }) => {
    if (!usersMocks.authOk) {
      return {
        status: probe.unauthenticatedStatus ?? 401,
        error: probe.unauthorizedError ?? 'Unauthorized',
      };
    }
    const minRole = typeof probe.minRole === 'function' ? probe.minRole(req.method) : probe.minRole;
    const ranks: Record<string, number> = { viewer: 1, editor: 2, admin: 3 };
    if ((ranks[usersMocks.role] ?? 1) < (ranks[minRole] ?? 3)) {
      return {
        status: probe.forbiddenStatus ?? 403,
        error: probe.forbiddenError ?? 'Forbidden',
      };
    }
    return { admin: { id: 'admin_1', role: usersMocks.role }, sessionId: 'sess_1' };
  },
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select(arg?: unknown) {
      const isList = arg && typeof arg === 'object' && 'walletAddress' in arg;
      if (isList) {
        return {
          from() {
            return {
              leftJoin() {
                return {
                  where() {
                    return {
                      orderBy() {
                        return {
                          limit: async () => usersMocks.users,
                        };
                      },
                    };
                  },
                };
              },
            };
          },
        };
      }
      return {
        from() {
          return {
            where: async () => {
              const row = usersMocks.users.find((u) => u.id === usersMocks.deleteId);
              return row ? [row] : [];
            },
          };
        },
      };
    },
    delete() {
      return {
        where: async () => {
          usersMocks.deleted = true;
          usersMocks.users = usersMocks.users.filter((u) => u.id !== usersMocks.deleteId);
        },
      };
    },
  }),
  schema: {
    users: {
      id: 'users.id',
      walletAddress: 'users.walletAddress',
      role: 'users.role',
      points: 'users.points',
      createdAt: 'users.createdAt',
    },
    userSettings: {
      userId: 'userSettings.userId',
      displayName: 'userSettings.displayName',
      email: 'userSettings.email',
    },
  },
}));

import adminUsersRoute, { ADMIN_USERS_PROBE as routeProbe } from '../../api/admin/users/route';
import { writeAdminAudit } from '../../api/lib/adminAudit';

describe('adminUsers helpers', () => {
  it('parseAdminUsersQuery trims q param', () => {
    expect(parseAdminUsersQuery(new URLSearchParams('q= EQabc '))).toBe('EQabc');
    expect(parseAdminUsersQuery(new URLSearchParams())).toBe('');
  });

  it('parseAdminUserDeleteId trims id param', () => {
    expect(parseAdminUserDeleteId(new URLSearchParams('id= user-9 '))).toBe('user-9');
    expect(parseAdminUserDeleteId(new URLSearchParams())).toBe('');
  });

  it('exports stable e2e probe contract', () => {
    expect(ADMIN_USERS_PROBE.path).toBe('/api/admin/users');
    expect(routeProbe.getMinRole).toBe('viewer');
    expect(routeProbe.deleteMinRole).toBe('admin');
    expect(routeProbe.methods).toEqual(['GET', 'DELETE', 'OPTIONS']);
  });
});

describe('/api/admin/users e2e probe', () => {
  beforeEach(() => {
    usersMocks.authOk = true;
    usersMocks.role = 'admin';
    usersMocks.deleteId = '';
    usersMocks.deleted = false;
    usersMocks.users = [
      {
        id: 'user-1',
        walletAddress: 'EQabc123',
        role: 'user',
        points: 10,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        displayName: 'Ion',
        email: 'ion@test.com',
      },
    ];
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_USERS_PATH);
    expect(src).toContain('api/admin/users/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminUsersRoute(
      new Request(`http://test${ADMIN_USERS_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('DELETE');
  });

  it('GET requires admin auth', async () => {
    usersMocks.authOk = false;
    const res = await adminUsersRoute(adminRequest(ADMIN_USERS_PATH, { method: 'GET' }));
    expect(res.status).toBe(ADMIN_USERS_PROBE.unauthenticatedStatus);
  });

  it('GET returns users list', async () => {
    const res = await adminUsersRoute(adminRequest(ADMIN_USERS_PATH, { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { users: Array<{ id: string; walletAddress: string }> };
    expect(body.users[0]?.id).toBe('user-1');
    expect(body.users[0]?.walletAddress).toBe('EQabc123');
  });

  it('DELETE removes user and writes audit', async () => {
    usersMocks.deleteId = 'user-1';
    const res = await adminUsersRoute(
      adminRequest(`${ADMIN_USERS_PATH}?id=user-1`, { method: 'DELETE' }),
    );
    expect(res.status).toBe(200);
    expect(usersMocks.deleted).toBe(true);
    expect(writeAdminAudit).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({ admin: expect.objectContaining({ id: 'admin_1' }) }),
      ADMIN_USERS_PROBE.auditAction,
      'user',
      'user-1',
      expect.objectContaining({ walletAddress: 'EQabc123' }),
    );
  });

  it('DELETE requires id', async () => {
    const res = await adminUsersRoute(adminRequest(ADMIN_USERS_PATH, { method: 'DELETE' }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(ADMIN_USERS_PROBE.missingIdError);
  });

  it('POST returns 405', async () => {
    const res = await adminUsersRoute(adminRequest(ADMIN_USERS_PATH, { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});