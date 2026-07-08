// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildUserMfaAccountName, USER_MFA_SETUP_PATH, USER_MFA_SETUP_PROBE } from '../../api/lib/userMfaSetup';

const setupMocks = vi.hoisted(() => ({
  authOk: true,
  upserted: false,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!setupMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return { user: { id: 'user-1', walletAddress: 'EQabc', role: 'user' }, sid: 'sess-1', mfaEnabled: false };
  },
  encryptForDb: vi.fn(async () => 'enc-secret'),
}));

vi.mock('../../api/lib/totp', () => ({
  generateTotpSecretBase32: vi.fn(() => 'BASE32SECRET'),
  buildOtpAuthUrl: vi.fn(() => 'otpauth://totp/Solaris%20CET:EQabc?secret=BASE32SECRET'),
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    insert() {
      return {
        values() {
          return {
            onConflictDoUpdate: async () => {
              setupMocks.upserted = true;
            },
          };
        },
      };
    },
  }),
  schema: { userMfa: { userId: 'userMfa.userId' } },
}));

import userMfaSetupRoute, { USER_MFA_SETUP_PROBE as routeProbe } from '../../api/security/mfa/setup/route';

function setupRequest(): Request {
  return new Request(`http://test${USER_MFA_SETUP_PATH}`, {
    method: 'POST',
    headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
  });
}

describe('userMfaSetup helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(USER_MFA_SETUP_PROBE.path).toBe('/api/security/mfa/setup');
    expect(routeProbe.totpIssuer).toBe('Solaris CET');
    expect(routeProbe.secretBytes).toBe(20);
  });

  it('buildUserMfaAccountName prefers wallet address', () => {
    expect(buildUserMfaAccountName({ id: 'user-1', walletAddress: 'EQabc' })).toBe('EQabc');
    expect(buildUserMfaAccountName({ id: 'user-1', walletAddress: null })).toBe('user-1');
  });
});

describe('/api/security/mfa/setup e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks.authOk = true;
    setupMocks.upserted = false;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(USER_MFA_SETUP_PATH);
    expect(src).toContain('api/security/mfa/setup/route.js');
  });

  it('POST returns secret and otpauth URL', async () => {
    const res = await userMfaSetupRoute(setupRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; secretBase32: string; otpauthUrl: string };
    expect(body.ok).toBe(true);
    expect(body.secretBase32).toBe('BASE32SECRET');
    expect(body.otpauthUrl).toContain('otpauth://totp');
    expect(setupMocks.upserted).toBe(true);
  });
});