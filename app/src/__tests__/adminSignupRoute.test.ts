// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_SIGNUP_PATH,
  ADMIN_SIGNUP_PROBE,
  isAdminSignupTokenValid,
  parseAdminSignupBody,
} from '../../api/lib/adminSignup';

type InviteRow = {
  id: string;
  tokenHash: string;
  role: 'admin' | 'editor' | 'viewer';
  maxUses: number;
  usedCount: number;
  expiresAt: Date | null;
  revokedAt: Date | null;
};

type AdminRow = { id: string; email: string; role: InviteRow['role'] };

const signupState = vi.hoisted(() => ({
  invites: [
    {
      id: 'inv_1',
      tokenHash: 'hash:good-token-1234567890',
      role: 'editor' as const,
      maxUses: 1,
      usedCount: 0,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    },
  ] as InviteRow[],
  admins: [] as AdminRow[],
}));

function makeDb(state: { invites: InviteRow[]; admins: AdminRow[] }) {
  const txApi = (draft: typeof state) => ({
    update() {
      return {
        set(values: Record<string, unknown>) {
          const invite = draft.invites[0];
          if (invite && typeof values.usedCount !== 'undefined') {
            invite.usedCount += 1;
          }
          return {
            where() {
              return {
                returning() {
                  if (!invite) return Promise.resolve([]);
                  if (invite.revokedAt) return Promise.resolve([]);
                  if (invite.expiresAt && invite.expiresAt.getTime() <= Date.now()) return Promise.resolve([]);
                  if (invite.usedCount > invite.maxUses) return Promise.resolve([]);
                  return Promise.resolve([{ id: invite.id, role: invite.role }]);
                },
              };
            },
          };
        },
      };
    },
    insert(table: unknown) {
      return {
        values(values: Record<string, unknown>) {
          return {
            returning() {
              const tableName =
                table && typeof table === 'object' && '__table' in (table as Record<string, unknown>)
                  ? String((table as Record<string, unknown>).__table)
                  : '';
              if (tableName === 'adminAccounts') {
                const email = String(values.email ?? '');
                if (draft.admins.some((a) => a.email === email)) {
                  throw new Error('duplicate key value violates unique constraint');
                }
                const row: AdminRow = {
                  id: `adm_${draft.admins.length + 1}`,
                  email,
                  role: String(values.role) as AdminRow['role'],
                };
                draft.admins.unshift(row);
                return Promise.resolve([row]);
              }
              if (tableName === 'adminSessions') {
                return Promise.resolve([{ id: 'sess_new_1' }]);
              }
              return Promise.resolve([{ id: 'unknown' }]);
            },
          };
        },
      };
    },
  });

  return {
    transaction<T>(fn: (tx: ReturnType<typeof txApi>) => Promise<T>) {
      const draft = {
        invites: state.invites.map((i) => ({ ...i })),
        admins: state.admins.map((a) => ({ ...a })),
      };
      return fn(txApi(draft)).then((res) => {
        state.invites = draft.invites;
        state.admins = draft.admins;
        return res;
      });
    },
  };
}

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: (origin: string | null) =>
    origin === 'https://evil.test' ? 'https://allowed.test' : (origin ?? 'https://allowed.test'),
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
}));

vi.mock('../../api/lib/jwt', () => ({
  getJwtSecretsFromEnv: vi.fn(() => ['secret']),
  signJwt: vi.fn(async () => 'jwt_token'),
}));

vi.mock('../../api/lib/password', () => ({
  hashPassword: vi.fn(async () => 'pw_hash'),
}));

vi.mock('../../api/lib/adminAudit', () => ({
  writeAdminAudit: vi.fn(async () => undefined),
}));

vi.mock('../../api/lib/clientIp', () => ({
  clientIp: () => '1.1.1.1',
}));

vi.mock('../../api/lib/nodeCrypto', () => ({
  sha256Hex: vi.fn((input: string) => `hash:${input}`),
}));

vi.mock('../../db/client', () => ({
  getDb: () => makeDb(signupState),
  schema: {
    adminInvites: {
      id: 'id',
      role: 'role',
      tokenHash: 'tokenHash',
      usedCount: 'usedCount',
      maxUses: 'maxUses',
      revokedAt: 'revokedAt',
      expiresAt: 'expiresAt',
    },
    adminAccounts: { __table: 'adminAccounts', id: 'id', email: 'email', role: 'role' },
    adminSessions: { __table: 'adminSessions', id: 'id' },
  },
}));

import adminSignupRoute, { ADMIN_SIGNUP_PROBE as routeProbe } from '../../api/admin/signup/route';
import { writeAdminAudit } from '../../api/lib/adminAudit';
import { getJwtSecretsFromEnv, signJwt } from '../../api/lib/jwt';
import { hashPassword } from '../../api/lib/password';
import { sha256Hex } from '../../api/lib/nodeCrypto';

function signupRequest(body: unknown, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${ADMIN_SIGNUP_PATH}`, {
    method: 'POST',
    ...init,
    headers,
    body: JSON.stringify(body),
  });
}

describe('adminSignup helpers', () => {
  it('parseAdminSignupBody normalizes email and trims token', () => {
    expect(
      parseAdminSignupBody({ token: '  invite-token-1234567890  ', email: ' Admin@Test.COM ', password: '0123456789x' }),
    ).toEqual({
      token: 'invite-token-1234567890',
      email: 'admin@test.com',
      password: '0123456789x',
    });
    expect(parseAdminSignupBody(null)).toEqual({ token: '', email: '', password: '' });
  });

  it('isAdminSignupTokenValid enforces token length bounds', () => {
    expect(isAdminSignupTokenValid('short')).toBe(false);
    expect(isAdminSignupTokenValid('good-token-1234567890')).toBe(true);
    expect(isAdminSignupTokenValid('x'.repeat(ADMIN_SIGNUP_PROBE.maxTokenLength + 1))).toBe(false);
  });

  it('exports stable e2e probe contract', () => {
    expect(ADMIN_SIGNUP_PROBE.path).toBe('/api/admin/signup');
    expect(routeProbe.authRequired).toBe(false);
    expect(routeProbe.rateLimitKey).toBe('admin-signup');
    expect(routeProbe.methods).toEqual(['POST', 'OPTIONS']);
  });
});

describe('/api/admin/signup e2e probe', () => {
  beforeEach(() => {
    signupState.invites[0].usedCount = 0;
    signupState.admins = [];
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_SIGNUP_PATH);
    expect(src).toContain('api/admin/signup/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminSignupRoute(
      new Request(`http://test${ADMIN_SIGNUP_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('POST returns 400 for invalid token without transaction', async () => {
    const res = await adminSignupRoute(signupRequest({ token: 'short', email: 'a@b.com', password: '0123456789x' }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Token invalid');
    expect(signupState.invites[0].usedCount).toBe(0);
    expect(hashPassword).not.toHaveBeenCalled();
    expect(signJwt).not.toHaveBeenCalled();
  });

  it('POST signup succeeds and consumes invite', async () => {
    const res = await adminSignupRoute(
      signupRequest({ token: 'good-token-1234567890', email: 'A@B.com', password: '0123456789x' }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { token: string; admin: { email: string; role: string } };
    expect(body.token).toBe('jwt_token');
    expect(body.admin.email).toBe('a@b.com');
    expect(body.admin.role).toBe('editor');
    expect(sha256Hex).toHaveBeenCalledWith('good-token-1234567890');
    expect(getJwtSecretsFromEnv).toHaveBeenCalled();
    expect(hashPassword).toHaveBeenCalledWith('0123456789x');
    expect(signJwt).toHaveBeenCalled();
    expect(writeAdminAudit).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({ admin: expect.objectContaining({ email: 'a@b.com' }) }),
      ADMIN_SIGNUP_PROBE.auditAction,
      'admin_account',
      expect.any(String),
      expect.objectContaining({ email: 'a@b.com', role: 'editor', inviteId: 'inv_1' }),
    );
    expect(signupState.invites[0].usedCount).toBe(1);
  });

  it('GET returns 405', async () => {
    const res = await adminSignupRoute(
      new Request(`http://test${ADMIN_SIGNUP_PATH}`, {
        method: 'GET',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(405);
  });
});