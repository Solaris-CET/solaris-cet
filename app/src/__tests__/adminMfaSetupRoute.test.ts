// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ADMIN_MFA_SETUP_PATH, ADMIN_MFA_SETUP_PROBE } from '../../api/lib/adminMfaSetup';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'admin' as 'admin' | 'editor' | 'viewer',
  updatedMfaSecret: null as string | null,
  mfaEnabledAt: 'unchanged' as Date | null | 'unchanged',
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: (origin: string | null) =>
    origin === 'https://evil.test' ? 'https://allowed.test' : (origin ?? 'https://allowed.test'),
}));

vi.mock('../../api/lib/crypto', () => ({
  encryptApiKeyWithEnvPrimary: vi.fn(async () => 'enc'),
}));

vi.mock('../../api/lib/totp', () => ({
  generateTotpSecretBase32: vi.fn(() => 'BASE32SECRET'),
  buildOtpAuthUrl: vi.fn(() => 'otpauth://totp/Solaris%20Admin:admin@test.com?secret=BASE32SECRET'),
}));

vi.mock('../../api/lib/adminAuth', () => ({
  requireAdminAuth: async () => {
    if (!adminMocks.authOk) return { status: 401, error: 'Unauthorized' };
    return { admin: { id: 'admin_1', role: adminMocks.role }, sessionId: 'sess_1' };
  },
}));
import adminMfaSetupRoute, { ADMIN_MFA_SETUP_PROBE as routeProbe } from '../../api/admin/mfa/setup/route';
import { encryptApiKeyWithEnvPrimary } from '../../api/lib/crypto';
import { buildOtpAuthUrl, generateTotpSecretBase32 } from '../../api/lib/totp';

function setupRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('Authorization', 'Bearer admin-token');
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${ADMIN_MFA_SETUP_PATH}`, {
    method: 'POST',
    ...init,
    headers,
  });
}

describe('adminMfaSetup helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(ADMIN_MFA_SETUP_PROBE.path).toBe('/api/admin/mfa/setup');
    expect(routeProbe.minRole).toBe('admin');
    expect(routeProbe.authRequired).toBe(true);
    expect(routeProbe.totpIssuer).toBe('Solaris Admin');
    expect(routeProbe.methods).toEqual(['POST', 'OPTIONS']);
  });
});

describe('/api/admin/mfa/setup e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.role = 'admin';
    adminMocks.updatedMfaSecret = null;
    adminMocks.mfaEnabledAt = 'unchanged';
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_MFA_SETUP_PATH);
    expect(src).toContain('api/admin/mfa/setup/route.js');
    expect(src).toContain('api/admin/mfa/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminMfaSetupRoute(
      new Request(`http://test${ADMIN_MFA_SETUP_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('POST requires admin auth', async () => {
    adminMocks.authOk = false;
    const res = await adminMfaSetupRoute(setupRequest());
    expect(res.status).toBe(ADMIN_MFA_SETUP_PROBE.unauthenticatedStatus);
  });

  it('POST requires admin role', async () => {
    adminMocks.role = 'editor';
    const res = await adminMfaSetupRoute(setupRequest());
    expect(res.status).toBe(403);
  });

  it('POST setup succeeds and stores encrypted secret', async () => {
    const res = await adminMfaSetupRoute(setupRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; secret: string; otpauthUrl: string };
    expect(body.ok).toBe(true);
    expect(body.secret).toBe('BASE32SECRET');
    expect(body.otpauthUrl).toContain('otpauth://totp');
    expect(generateTotpSecretBase32).toHaveBeenCalledWith(ADMIN_MFA_SETUP_PROBE.secretBytes);
    expect(encryptApiKeyWithEnvPrimary).toHaveBeenCalledWith('BASE32SECRET');
    expect(buildOtpAuthUrl).toHaveBeenCalledWith({
      issuer: ADMIN_MFA_SETUP_PROBE.totpIssuer,
      accountName: 'admin@test.com',
      secretBase32: 'BASE32SECRET',
    });
    expect(adminMocks.updatedMfaSecret).toBe('enc');
    expect(adminMocks.mfaEnabledAt).toBeNull();
  });

  it('GET returns 405', async () => {
    const res = await adminMfaSetupRoute(
      new Request(`http://test${ADMIN_MFA_SETUP_PATH}`, {
        method: 'GET',
        headers: { Authorization: 'Bearer admin-token', origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(405);
  });
});