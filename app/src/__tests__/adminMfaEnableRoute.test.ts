// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_MFA_ENABLE_PATH,
  ADMIN_MFA_ENABLE_PROBE,
  isValidMfaTotpCode,
  parseMfaTotpCode,
} from '../../api/lib/adminMfaEnable';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'admin' as 'admin' | 'editor' | 'viewer',
  mfaEnabledAt: null as Date | null,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: (origin: string | null) =>
    origin === 'https://evil.test' ? 'https://allowed.test' : (origin ?? 'https://allowed.test'),
}));

vi.mock('../../api/lib/crypto', () => ({
  decryptApiKeyWithEnvSecrets: vi.fn(async () => 'totp-secret'),
}));

vi.mock('../../api/lib/totp', () => ({
  verifyTotpCode: vi.fn(() => true),
}));

vi.mock('../../api/lib/adminAuth', () => ({
  requireAdminAuth: async () => {
    if (!adminMocks.authOk) return { status: 401, error: 'Unauthorized' };
    return { admin: { id: 'admin_1', role: adminMocks.role }, sessionId: 'sess_1' };
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
                limit: async () => [{ id: 'admin_1', mfaSecretEncrypted: 'enc-secret' }],
              };
            },
          };
        },
      };
    },
    update() {
      return {
        set(values: Record<string, unknown>) {
          if ('mfaEnabledAt' in values) {
            adminMocks.mfaEnabledAt = values.mfaEnabledAt as Date;
          }
          return { where: async () => undefined };
        },
      };
    },
  }),
  schema: {
    adminAccounts: {
      id: 'adminAccounts.id',
      mfaSecretEncrypted: 'adminAccounts.mfaSecretEncrypted',
      mfaEnabledAt: 'adminAccounts.mfaEnabledAt',
    },
  },
}));

import adminMfaEnableRoute, { ADMIN_MFA_ENABLE_PROBE as routeProbe } from '../../api/admin/mfa/enable/route';
import { decryptApiKeyWithEnvSecrets } from '../../api/lib/crypto';
import { verifyTotpCode } from '../../api/lib/totp';

function enableRequest(body: unknown, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('Authorization', 'Bearer admin-token');
  headers.set('Content-Type', 'application/json');
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${ADMIN_MFA_ENABLE_PATH}`, {
    method: 'POST',
    ...init,
    headers,
    body: JSON.stringify(body),
  });
}

describe('adminMfaEnable helpers', () => {
  it('parseMfaTotpCode and isValidMfaTotpCode validate TOTP codes', () => {
    expect(parseMfaTotpCode({ code: '654321' })).toBe('654321');
    expect(parseMfaTotpCode({ code: 123456 })).toBe('');
    expect(isValidMfaTotpCode('654321')).toBe(true);
    expect(isValidMfaTotpCode('65432')).toBe(false);
  });

  it('exports stable e2e probe contract', () => {
    expect(ADMIN_MFA_ENABLE_PROBE.path).toBe('/api/admin/mfa/enable');
    expect(routeProbe.minRole).toBe('admin');
    expect(routeProbe.authRequired).toBe(true);
    expect(routeProbe.methods).toEqual(['POST', 'OPTIONS']);
  });
});

describe('/api/admin/mfa/enable e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.role = 'admin';
    adminMocks.mfaEnabledAt = null;
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_MFA_ENABLE_PATH);
    expect(src).toContain('api/admin/mfa/enable/route.js');
    expect(src).toContain('api/admin/mfa/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminMfaEnableRoute(
      new Request(`http://test${ADMIN_MFA_ENABLE_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('POST requires admin auth', async () => {
    adminMocks.authOk = false;
    const res = await adminMfaEnableRoute(enableRequest({ code: '654321' }));
    expect(res.status).toBe(ADMIN_MFA_ENABLE_PROBE.unauthenticatedStatus);
  });

  it('POST enable succeeds and sets mfaEnabledAt', async () => {
    const res = await adminMfaEnableRoute(enableRequest({ code: '654321' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    expect(decryptApiKeyWithEnvSecrets).toHaveBeenCalledWith('enc-secret');
    expect(verifyTotpCode).toHaveBeenCalledWith('totp-secret', '654321', expect.any(Number), 1);
    expect(adminMocks.mfaEnabledAt).toBeInstanceOf(Date);
  });

  it('GET returns 405', async () => {
    const res = await adminMfaEnableRoute(
      new Request(`http://test${ADMIN_MFA_ENABLE_PATH}`, {
        method: 'GET',
        headers: { Authorization: 'Bearer admin-token', origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(405);
  });
});