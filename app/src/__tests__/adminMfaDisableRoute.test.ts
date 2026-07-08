// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_MFA_DISABLE_PATH,
  ADMIN_MFA_DISABLE_PROBE,
  isValidMfaTotpCode,
  parseMfaTotpCode,
} from '../../api/lib/adminMfaDisable';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'admin' as 'admin' | 'editor' | 'viewer',
  mfaCleared: false,
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
import adminMfaDisableRoute, { ADMIN_MFA_DISABLE_PROBE as routeProbe } from '../../api/admin/mfa/disable/route';
import { decryptApiKeyWithEnvSecrets } from '../../api/lib/crypto';
import { verifyTotpCode } from '../../api/lib/totp';

function disableRequest(body: unknown, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('Authorization', 'Bearer admin-token');
  headers.set('Content-Type', 'application/json');
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${ADMIN_MFA_DISABLE_PATH}`, {
    method: 'POST',
    ...init,
    headers,
    body: JSON.stringify(body),
  });
}

describe('adminMfaDisable helpers', () => {
  it('parseMfaTotpCode and isValidMfaTotpCode validate TOTP codes', () => {
    expect(parseMfaTotpCode({ code: ' 123456 ' })).toBe('123456');
    expect(parseMfaTotpCode(null)).toBe('');
    expect(isValidMfaTotpCode('123456')).toBe(true);
    expect(isValidMfaTotpCode('12345')).toBe(false);
    expect(isValidMfaTotpCode('abcdef')).toBe(false);
  });

  it('exports stable e2e probe contract', () => {
    expect(ADMIN_MFA_DISABLE_PROBE.path).toBe('/api/admin/mfa/disable');
    expect(routeProbe.minRole).toBe('admin');
    expect(routeProbe.authRequired).toBe(true);
    expect(routeProbe.methods).toEqual(['POST', 'OPTIONS']);
  });
});

describe('/api/admin/mfa/disable e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.role = 'admin';
    adminMocks.mfaCleared = false;
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_MFA_DISABLE_PATH);
    expect(src).toContain('api/admin/mfa/disable/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminMfaDisableRoute(
      new Request(`http://test${ADMIN_MFA_DISABLE_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('POST requires admin auth', async () => {
    adminMocks.authOk = false;
    const res = await adminMfaDisableRoute(disableRequest({ code: '123456' }));
    expect(res.status).toBe(ADMIN_MFA_DISABLE_PROBE.unauthenticatedStatus);
  });

  it('POST disable succeeds and clears MFA', async () => {
    const res = await adminMfaDisableRoute(disableRequest({ code: '123456' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    expect(decryptApiKeyWithEnvSecrets).toHaveBeenCalledWith('enc-secret');
    expect(verifyTotpCode).toHaveBeenCalledWith('totp-secret', '123456', expect.any(Number), 1);
    expect(adminMocks.mfaCleared).toBe(true);
  });

  it('GET returns 405', async () => {
    const res = await adminMfaDisableRoute(
      new Request(`http://test${ADMIN_MFA_DISABLE_PATH}`, {
        method: 'GET',
        headers: { Authorization: 'Bearer admin-token', origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(405);
  });
});