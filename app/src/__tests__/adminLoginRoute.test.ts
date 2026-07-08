// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_LOGIN_PATH,
  ADMIN_LOGIN_PROBE,
  isAdminLoginPasswordValid,
  parseAdminLoginBody,
} from '../../api/lib/adminLogin';

const adminMocks = vi.hoisted(() => ({
  sessionInserted: false,
  lastLoginUpdated: false,
}));

const adminAccount = vi.hoisted(() => ({
  id: 'admin-acc-1',
  email: 'admin@test.com',
  passwordHash: 'hash',
  role: 'admin' as const,
  disabledAt: null as Date | null,
  mfaEnabledAt: null as Date | null,
  mfaSecretEncrypted: null as string | null,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: (origin: string | null) =>
    origin === 'https://evil.test' ? 'https://allowed.test' : (origin ?? 'https://allowed.test'),
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
}));

vi.mock('../../api/lib/adminAudit', () => ({
  writeAdminAudit: vi.fn(async () => undefined),
}));

vi.mock('../../api/lib/clientIp', () => ({
  clientIp: () => '127.0.0.1',
}));

vi.mock('../../api/lib/jwt', () => ({
  getJwtSecretsFromEnv: () => ['secret'],
  signJwt: vi.fn(async () => 'jwt-token'),
}));

vi.mock('../../api/lib/password', () => ({
  hashPassword: vi.fn(async (p: string) => `hash:${p}`),
  verifyPassword: vi.fn(async () => true),
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select(arg?: unknown) {
      if (arg && typeof arg === 'object' && 'c' in arg) {
        return {
          from: async () => [{ c: 1 }],
        };
      }
      return {
        from() {
          return {
            where: async () => [adminAccount],
          };
        },
      };
    },
    insert() {
      return {
        values() {
          return {
            returning: async () => [{ id: 'sess-new-1' }],
          };
        },
      };
    },
    update() {
      return {
        set() {
          return {
            where: async () => {
              adminMocks.lastLoginUpdated = true;
            },
          };
        },
      };
    },
  }),
  schema: {
    adminAccounts: {
      id: 'adminAccounts.id',
      email: 'adminAccounts.email',
      passwordHash: 'adminAccounts.passwordHash',
      role: 'adminAccounts.role',
      disabledAt: 'adminAccounts.disabledAt',
      mfaEnabledAt: 'adminAccounts.mfaEnabledAt',
      mfaSecretEncrypted: 'adminAccounts.mfaSecretEncrypted',
      lastLoginAt: 'adminAccounts.lastLoginAt',
    },
    adminSessions: {
      id: 'adminSessions.id',
      adminId: 'adminSessions.adminId',
      ip: 'adminSessions.ip',
      userAgent: 'adminSessions.userAgent',
      expiresAt: 'adminSessions.expiresAt',
    },
  },
}));

import adminLoginRoute, { ADMIN_LOGIN_PROBE as routeProbe } from '../../api/admin/login/route';
import { writeAdminAudit } from '../../api/lib/adminAudit';
import { signJwt } from '../../api/lib/jwt';
import { verifyPassword } from '../../api/lib/password';

function loginRequest(body: unknown, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${ADMIN_LOGIN_PATH}`, {
    method: 'POST',
    ...init,
    headers,
    body: JSON.stringify(body),
  });
}

describe('adminLogin helpers', () => {
  it('parseAdminLoginBody normalizes email and extracts fields', () => {
    expect(parseAdminLoginBody({ email: '  Admin@Test.COM ', password: 'secret12345', mfaCode: '123456' })).toEqual({
      email: 'admin@test.com',
      password: 'secret12345',
      mfaCode: '123456',
    });
    expect(parseAdminLoginBody(null)).toEqual({ email: '', password: '', mfaCode: '' });
  });

  it('isAdminLoginPasswordValid enforces length bounds', () => {
    expect(isAdminLoginPasswordValid('short')).toBe(false);
    expect(isAdminLoginPasswordValid('validpassword1')).toBe(true);
    expect(isAdminLoginPasswordValid('x'.repeat(ADMIN_LOGIN_PROBE.maxPasswordLength + 1))).toBe(false);
  });

  it('exports stable e2e probe contract', () => {
    expect(ADMIN_LOGIN_PROBE.path).toBe('/api/admin/login');
    expect(routeProbe.authRequired).toBe(false);
    expect(routeProbe.rateLimitKey).toBe('admin-login');
    expect(routeProbe.auditAction).toBe('ADMIN_LOGIN');
    expect(routeProbe.methods).toEqual(['POST', 'OPTIONS']);
  });
});

describe('/api/admin/login e2e probe', () => {
  beforeEach(() => {
    adminMocks.sessionInserted = false;
    adminMocks.lastLoginUpdated = false;
    adminAccount.disabledAt = null;
    adminAccount.mfaEnabledAt = null;
    adminAccount.mfaSecretEncrypted = null;
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_LOGIN_PATH);
    expect(src).toContain('api/admin/login/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminLoginRoute(
      new Request(`http://test${ADMIN_LOGIN_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('rejects unknown origins', async () => {
    const res = await adminLoginRoute(
      new Request(`http://test${ADMIN_LOGIN_PATH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          origin: 'https://evil.test',
        },
        body: JSON.stringify({ email: 'admin@test.com', password: 'validpassword1' }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it('POST returns 400 for invalid password length', async () => {
    const res = await adminLoginRoute(loginRequest({ email: 'admin@test.com', password: 'short' }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Parolă invalidă');
  });

  it('POST login succeeds and returns token', async () => {
    const res = await adminLoginRoute(
      loginRequest({ email: 'admin@test.com', password: 'validpassword1' }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      token: string;
      admin: { id: string; email: string; role: string };
    };
    expect(body.token).toBe('jwt-token');
    expect(body.admin).toEqual({
      id: 'admin-acc-1',
      email: 'admin@test.com',
      role: 'admin',
    });
    expect(verifyPassword).toHaveBeenCalledWith('validpassword1', 'hash');
    expect(signJwt).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'admin', sub: 'admin-acc-1', sid: 'sess-new-1' }),
      'secret',
      ADMIN_LOGIN_PROBE.jwtTtlSeconds,
    );
    expect(adminMocks.lastLoginUpdated).toBe(true);
    expect(writeAdminAudit).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({
        admin: expect.objectContaining({ id: 'admin-acc-1' }),
        sessionId: 'sess-new-1',
      }),
      'ADMIN_LOGIN',
      'admin_account',
      'admin-acc-1',
      expect.objectContaining({ email: 'admin@test.com', sid: 'sess-new-1' }),
    );
  });

  it('GET returns 405', async () => {
    const res = await adminLoginRoute(
      new Request(`http://test${ADMIN_LOGIN_PATH}`, {
        method: 'GET',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(405);
  });
});