// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ADMIN_MFA_PATH, ADMIN_MFA_PROBE, resolveMfaStatus } from '../../api/lib/adminMfa';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  mfaEnabledAt: new Date('2024-01-15T12:00:00.000Z') as Date | null,
  mfaSecretEncrypted: 'enc-secret' as string | null,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: (origin: string | null) =>
    origin === 'https://evil.test' ? 'https://allowed.test' : (origin ?? 'https://allowed.test'),
}));

vi.mock('../../api/lib/adminAuth', () => ({
  requireAdminAuth: async () => {
    if (!adminMocks.authOk) return { status: 401, error: 'Unauthorized' };
    return { admin: { id: 'admin_1', role: 'admin' }, sessionId: 'sess_1' };
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
                limit: async () => [
                  {
                    id: 'admin_1',
                    mfaEnabledAt: adminMocks.mfaEnabledAt,
                    mfaSecretEncrypted: adminMocks.mfaSecretEncrypted,
                  },
                ],
              };
            },
          };
        },
      };
    },
  }),
  schema: {
    adminAccounts: {
      id: 'adminAccounts.id',
      mfaEnabledAt: 'adminAccounts.mfaEnabledAt',
      mfaSecretEncrypted: 'adminAccounts.mfaSecretEncrypted',
    },
  },
}));

import adminMfaRoute, { ADMIN_MFA_PROBE as routeProbe } from '../../api/admin/mfa/route';

describe('adminMfa helpers', () => {
  it('resolveMfaStatus derives enabled and pending flags', () => {
    expect(
      resolveMfaStatus({ mfaEnabledAt: new Date(), mfaSecretEncrypted: 'enc' }),
    ).toEqual({ enabled: true, pending: false });
    expect(
      resolveMfaStatus({ mfaEnabledAt: null, mfaSecretEncrypted: 'enc' }),
    ).toEqual({ enabled: false, pending: true });
    expect(
      resolveMfaStatus({ mfaEnabledAt: null, mfaSecretEncrypted: null }),
    ).toEqual({ enabled: false, pending: false });
  });

  it('exports stable e2e probe contract', () => {
    expect(ADMIN_MFA_PROBE.path).toBe('/api/admin/mfa');
    expect(routeProbe.authRequired).toBe(true);
    expect(routeProbe.unauthenticatedStatus).toBe(401);
    expect(routeProbe.methods).toEqual(['GET', 'OPTIONS']);
  });
});

describe('/api/admin/mfa e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.mfaEnabledAt = new Date('2024-01-15T12:00:00.000Z');
    adminMocks.mfaSecretEncrypted = 'enc-secret';
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_MFA_PATH);
    expect(src).toContain('api/admin/mfa/route.js');
    expect(src).toContain('api/admin/mfa/disable/route.js');
    expect(src).toContain('api/admin/mfa/enable/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminMfaRoute(
      new Request(`http://test${ADMIN_MFA_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('GET requires admin auth', async () => {
    adminMocks.authOk = false;
    const res = await adminMfaRoute(adminRequest(ADMIN_MFA_PATH, { method: 'GET' }));
    expect(res.status).toBe(ADMIN_MFA_PROBE.unauthenticatedStatus);
  });

  it('GET returns enabled:true when MFA is active', async () => {
    const res = await adminMfaRoute(adminRequest(ADMIN_MFA_PATH, { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; enabled: boolean; pending: boolean };
    expect(body.ok).toBe(true);
    expect(body.enabled).toBe(true);
    expect(body.pending).toBe(false);
  });

  it('POST returns 405', async () => {
    const res = await adminMfaRoute(adminRequest(ADMIN_MFA_PATH, { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});