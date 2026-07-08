// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { USER_MFA_ENABLE_PATH, USER_MFA_ENABLE_PROBE } from '../../api/lib/userMfaEnable';

const enableMocks = vi.hoisted(() => ({
  authOk: true,
  hasSecret: true,
  enabled: false,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!enableMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return { user: { id: 'user-1', walletAddress: 'EQabc', role: 'user' }, sid: 'sess-1', mfaEnabled: false };
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
  return { ...actual, notifyUserSecurityTelegram: vi.fn(async () => undefined) };
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
                  enableMocks.hasSecret ? [{ secretEncrypted: 'enc-secret', enabledAt: null }] : [{ secretEncrypted: null }],
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
              enableMocks.enabled = true;
            },
          };
        },
      };
    },
  }),
  schema: { userMfa: { userId: 'userMfa.userId' } },
}));

import userMfaEnableRoute, { USER_MFA_ENABLE_PROBE as routeProbe } from '../../api/security/mfa/enable/route';

function enableRequest(body: unknown): Request {
  return new Request(`http://test${USER_MFA_ENABLE_PATH}`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer valid-token',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('userMfaEnable helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(USER_MFA_ENABLE_PROBE.path).toBe('/api/security/mfa/enable');
    expect(routeProbe.setupRequiredError).toBe('MFA setup required');
  });
});

describe('/api/security/mfa/enable e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enableMocks.authOk = true;
    enableMocks.hasSecret = true;
    enableMocks.enabled = false;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(USER_MFA_ENABLE_PATH);
    expect(src).toContain('api/security/mfa/enable/route.js');
  });

  it('POST enables MFA with valid code', async () => {
    const res = await userMfaEnableRoute(enableRequest({ code: '654321' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    expect(enableMocks.enabled).toBe(true);
  });

  it('POST without setup secret returns 412', async () => {
    enableMocks.hasSecret = false;
    const res = await userMfaEnableRoute(enableRequest({ code: '654321' }));
    expect(res.status).toBe(USER_MFA_ENABLE_PROBE.setupRequiredStatus);
  });
});