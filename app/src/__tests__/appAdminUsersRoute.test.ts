// @vitest-environment node
import { authRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  APP_ADMIN_USERS_PATH,
  APP_ADMIN_USERS_PROBE,
  parseAppAdminUsersLimit,
} from '../../api/lib/appAdminUsers';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  mfaOk: true,
  users: [
    {
      id: 'user-1',
      walletAddress: 'EQabc',
      role: 'visitor',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    },
  ],
}));

vi.mock('../../api/lib/originGuard', () => ({
  ensureAllowedOrigin: () => ({ allowedOrigin: 'https://allowed.test' }),
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!adminMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return { user: { id: 'admin-1', role: 'admin' }, sid: null, mfaEnabled: true };
  },
  requireAdminMfa: async () => {
    if (!adminMocks.mfaOk) return { ok: false as const, error: 'MFA required', status: 412 };
    return { ok: true as const };
  },
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from() {
          return {
            orderBy() {
              return {
                limit: async () => adminMocks.users,
              };
            },
          };
        },
      };
    },
  }),
  schema: {
    users: {
      id: 'users.id',
      walletAddress: 'users.walletAddress',
      role: 'users.role',
      createdAt: 'users.createdAt',
    },
  },
}));

import appAdminUsersRoute, { APP_ADMIN_USERS_PROBE as routeProbe } from '../../api/app-admin/users/route';

describe('appAdminUsers helpers', () => {
  it('parseAppAdminUsersLimit applies defaults and bounds', () => {
    expect(parseAppAdminUsersLimit(new URLSearchParams())).toBe(APP_ADMIN_USERS_PROBE.defaultLimit);
    expect(parseAppAdminUsersLimit(new URLSearchParams('limit=100'))).toBe(100);
    expect(parseAppAdminUsersLimit(new URLSearchParams('limit=999'))).toBe(APP_ADMIN_USERS_PROBE.maxLimit);
  });

  it('exports stable e2e probe contract', () => {
    expect(APP_ADMIN_USERS_PROBE.path).toBe('/api/app-admin/users');
    expect(routeProbe.adminMfaRequired).toBe(true);
    expect(routeProbe.methods).toEqual(['GET', 'OPTIONS']);
  });
});

describe('/api/app-admin/users e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.mfaOk = true;
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(APP_ADMIN_USERS_PATH);
    expect(src).toContain('api/app-admin/users/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await appAdminUsersRoute(authRequest(APP_ADMIN_USERS_PATH, { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('GET requires auth', async () => {
    adminMocks.authOk = false;
    const res = await appAdminUsersRoute(authRequest(APP_ADMIN_USERS_PATH, { method: 'GET' }));
    expect(res.status).toBe(401);
  });

  it('GET requires admin MFA', async () => {
    adminMocks.mfaOk = false;
    const res = await appAdminUsersRoute(authRequest(APP_ADMIN_USERS_PATH, { method: 'GET' }));
    expect(res.status).toBe(412);
  });

  it('GET returns users list', async () => {
    const res = await appAdminUsersRoute(authRequest(APP_ADMIN_USERS_PATH, { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; users: Array<{ id: string; role: string }> };
    expect(body.ok).toBe(true);
    expect(body.users[0]?.id).toBe('user-1');
    expect(body.users[0]?.role).toBe('visitor');
  });

  it('POST returns 405', async () => {
    const res = await appAdminUsersRoute(authRequest(APP_ADMIN_USERS_PATH, { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});