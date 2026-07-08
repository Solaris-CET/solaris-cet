// @vitest-environment node
import { authRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  APP_ADMIN_USERS_ROLE_PATH,
  APP_ADMIN_USERS_ROLE_PROBE,
  parseAppAdminRole,
  parseRoleChangeBody,
} from '../../api/lib/appAdminUsersRole';

const roleMocks = vi.hoisted(() => ({
  authOk: true,
  mfaOk: true,
  targetUser: { id: 'user-2', walletAddress: 'EQtarget', role: 'visitor' },
  updated: false,
  auditInserted: false,
}));

vi.mock('../../api/lib/originGuard', () => ({
  ensureAllowedOrigin: () => ({ allowedOrigin: 'https://allowed.test' }),
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!roleMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return { user: { id: 'admin-1', role: 'admin' }, sid: null, mfaEnabled: true };
  },
  requireAdminMfa: async () => {
    if (!roleMocks.mfaOk) return { ok: false as const, error: 'MFA required', status: 412 };
    return { ok: true as const };
  },
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from() {
          return {
            where() {
              return {
                limit: async () => [roleMocks.targetUser],
              };
            },
          };
        },
      };
    },
    update() {
      return {
        set() {
          return {
            where: async () => {
              roleMocks.updated = true;
            },
          };
        },
      };
    },
    insert() {
      return {
        values: async () => {
          roleMocks.auditInserted = true;
        },
      };
    },
  }),
  schema: {
    users: { id: 'users.id', walletAddress: 'users.walletAddress', role: 'users.role' },
    auditLogs: { walletAddress: 'auditLogs.walletAddress', action: 'auditLogs.action', details: 'auditLogs.details' },
    userSettings: { userId: 'userSettings.userId', telegramNotificationsEnabled: 'userSettings.telegramNotificationsEnabled' },
    telegramLinks: { userId: 'telegramLinks.userId', chatId: 'telegramLinks.chatId' },
  },
}));

import appAdminUsersRoleRoute, { APP_ADMIN_USERS_ROLE_PROBE as routeProbe } from '../../api/app-admin/users/role/route';

describe('appAdminUsersRole helpers', () => {
  it('parseAppAdminRole and parseRoleChangeBody', () => {
    expect(parseAppAdminRole('investor')).toBe('investor');
    expect(parseAppAdminRole('bad')).toBeNull();
    expect(parseRoleChangeBody({ userId: 'user-2', role: 'admin' })).toEqual({
      ok: true,
      userId: 'user-2',
      role: 'admin',
    });
    expect(parseRoleChangeBody({ userId: '', role: 'admin' })).toEqual({
      ok: false,
      error: APP_ADMIN_USERS_ROLE_PROBE.invalidPayloadError,
    });
  });

  it('exports stable e2e probe contract', () => {
    expect(APP_ADMIN_USERS_ROLE_PROBE.path).toBe('/api/app-admin/users/role');
    expect(routeProbe.auditAction).toBe('USER_ROLE_CHANGED');
    expect(routeProbe.methods).toEqual(['POST', 'OPTIONS']);
  });
});

describe('/api/app-admin/users/role e2e probe', () => {
  beforeEach(() => {
    roleMocks.authOk = true;
    roleMocks.mfaOk = true;
    roleMocks.updated = false;
    roleMocks.auditInserted = false;
    roleMocks.targetUser = { id: 'user-2', walletAddress: 'EQtarget', role: 'visitor' };
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(APP_ADMIN_USERS_ROLE_PATH);
    expect(src).toContain('api/app-admin/users/role/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await appAdminUsersRoleRoute(authRequest(APP_ADMIN_USERS_ROLE_PATH, { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('POST rejects invalid payload', async () => {
    const res = await appAdminUsersRoleRoute(
      authRequest(APP_ADMIN_USERS_ROLE_PATH, { method: 'POST', body: JSON.stringify({ userId: 'x' }) }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(APP_ADMIN_USERS_ROLE_PROBE.invalidPayloadError);
  });

  it('POST rejects self role change', async () => {
    const res = await appAdminUsersRoleRoute(
      authRequest(APP_ADMIN_USERS_ROLE_PATH, {
        method: 'POST',
        body: JSON.stringify({ userId: 'admin-1', role: 'visitor' }),
      }),
    );
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(APP_ADMIN_USERS_ROLE_PROBE.cannotChangeOwnRoleError);
  });

  it('POST updates user role', async () => {
    const res = await appAdminUsersRoleRoute(
      authRequest(APP_ADMIN_USERS_ROLE_PATH, {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-2', role: 'investor' }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    expect(roleMocks.updated).toBe(true);
    expect(roleMocks.auditInserted).toBe(true);
  });

  it('GET returns 405', async () => {
    const res = await appAdminUsersRoleRoute(authRequest(APP_ADMIN_USERS_ROLE_PATH, { method: 'GET' }));
    expect(res.status).toBe(405);
  });
});