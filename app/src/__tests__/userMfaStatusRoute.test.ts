// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildUserMfaStatus, USER_MFA_STATUS_PATH, USER_MFA_STATUS_PROBE } from '../../api/lib/userMfaStatus';

const statusMocks = vi.hoisted(() => ({
  authOk: true,
  mfa: { enabledAt: new Date(), secretEncrypted: 'enc' } as { enabledAt: Date | null; secretEncrypted: string | null } | null,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!statusMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return { user: { id: 'user-1', walletAddress: 'EQabc', role: 'user' }, sid: 'sess-1', mfaEnabled: true };
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
                limit: async () => (statusMocks.mfa ? [statusMocks.mfa] : []),
              };
            },
          };
        },
      };
    },
  }),
  schema: { userMfa: { userId: 'userMfa.userId' } },
}));

import userMfaStatusRoute, { USER_MFA_STATUS_PROBE as routeProbe } from '../../api/security/mfa/route';

function statusRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('Authorization', 'Bearer valid-token');
  return new Request(`http://test${USER_MFA_STATUS_PATH}`, { ...init, headers });
}

describe('userMfaStatus helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(USER_MFA_STATUS_PROBE.path).toBe('/api/security/mfa');
    expect(routeProbe.methods).toEqual(['GET', 'OPTIONS']);
  });

  it('buildUserMfaStatus detects enabled and pending', () => {
    expect(buildUserMfaStatus({ enabledAt: new Date(), secretEncrypted: 'enc' })).toEqual({
      ok: true,
      enabled: true,
      pending: false,
    });
    expect(buildUserMfaStatus({ enabledAt: null, secretEncrypted: 'enc' })).toEqual({
      ok: true,
      enabled: false,
      pending: true,
    });
  });
});

describe('/api/security/mfa e2e probe', () => {
  beforeEach(() => {
    statusMocks.authOk = true;
    statusMocks.mfa = { enabledAt: new Date(), secretEncrypted: 'enc' };
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(USER_MFA_STATUS_PATH);
    expect(src).toContain('api/security/mfa/route.js');
  });

  it('GET returns MFA status', async () => {
    const res = await userMfaStatusRoute(statusRequest({ method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; enabled: boolean; pending: boolean };
    expect(body.ok).toBe(true);
    expect(body.enabled).toBe(true);
    expect(body.pending).toBe(false);
  });

  it('GET without auth returns 401', async () => {
    statusMocks.authOk = false;
    const res = await userMfaStatusRoute(statusRequest({ method: 'GET' }));
    expect(res.status).toBe(401);
  });
});