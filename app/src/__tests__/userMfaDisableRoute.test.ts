// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { USER_MFA_DISABLE_PATH, USER_MFA_DISABLE_PROBE } from '../../api/lib/userMfaDisable';

const disableMocks = vi.hoisted(() => ({
  authOk: true,
  mfaEnabled: true,
  secretBlob: 'enc-secret',
  disabled: false,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!disableMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return { user: { id: 'user-1', walletAddress: 'EQabc', role: 'user' }, sid: 'sess-1', mfaEnabled: true };
  },
}));

vi.mock('../../api/lib/crypto', () => ({
  decryptApiKeyWithEnvSecrets: vi.fn(async () => 'BASE32SECRET'),
}));

vi.mock('../../api/lib/totp', () => ({
  verifyTotpCode: vi.fn(() => true),
}));

vi.mock('../../api/lib/userMfaShared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/lib/userMfaShared')>();
  return {
    ...actual,
    notifyUserSecurityTelegram: vi.fn(async () => undefined),
  };
});

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from() {
          return {
            where() {
              return {
                limit: async () =>
                  disableMocks.mfaEnabled
                    ? [{ enabledAt: new Date(), secretEncrypted: disableMocks.secretBlob }]
                    : [{ enabledAt: null, secretEncrypted: null }],
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
              disableMocks.disabled = true;
            },
          };
        },
      };
    },
  }),
  schema: {
    userMfa: { userId: 'userMfa.userId', enabledAt: 'userMfa.enabledAt', secretEncrypted: 'userMfa.secretEncrypted' },
  },
}));

import { isValidMfaTotpCode as sharedValid,parseMfaTotpPostCode as sharedParse } from '../../api/lib/userMfaShared';
import userMfaDisableRoute, { USER_MFA_DISABLE_PROBE as routeProbe } from '../../api/security/mfa/disable/route';

function disableRequest(body: unknown, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('Authorization', 'Bearer valid-token');
  headers.set('Content-Type', 'application/json');
  return new Request(`http://test${USER_MFA_DISABLE_PATH}`, {
    method: 'POST',
    ...init,
    headers,
    body: JSON.stringify(body),
  });
}

describe('userMfaDisable helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(USER_MFA_DISABLE_PROBE.path).toBe('/api/security/mfa/disable');
    expect(routeProbe.authRequired).toBe(true);
    expect(routeProbe.notEnabledError).toBe('MFA not enabled');
  });

  it('shared MFA code parsing validates 6 digits', () => {
    expect(sharedParse({ code: '123456' })).toBe('123456');
    expect(sharedValid('123456')).toBe(true);
    expect(sharedValid('12345')).toBe(false);
  });
});

describe('/api/security/mfa/disable e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    disableMocks.authOk = true;
    disableMocks.mfaEnabled = true;
    disableMocks.disabled = false;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(USER_MFA_DISABLE_PATH);
    expect(src).toContain('api/security/mfa/disable/route.js');
  });

  it('POST disables MFA with valid code', async () => {
    const res = await userMfaDisableRoute(disableRequest({ code: '123456' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    expect(disableMocks.disabled).toBe(true);
  });

  it('POST with invalid code returns 400', async () => {
    const res = await userMfaDisableRoute(disableRequest({ code: 'abc' }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(USER_MFA_DISABLE_PROBE.invalidCodeError);
  });
});