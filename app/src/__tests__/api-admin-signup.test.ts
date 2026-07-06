import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
}));

vi.mock('../../api/lib/jwt', () => ({
  getJwtSecretsFromEnv: () => ['secret'],
  signJwt: async () => 'jwt_token',
}));

vi.mock('../../api/lib/password', () => ({
  hashPassword: async () => 'pw_hash',
}));

vi.mock('../../api/lib/adminAudit', () => ({
  writeAdminAudit: async () => undefined,
}));

vi.mock('../../api/lib/clientIp', () => ({
  clientIp: () => '1.1.1.1',
}));

vi.mock('../../api/lib/nodeCrypto', () => ({
  sha256Hex: (input: string) => `hash:${input}`,
}));

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
            returning(sel?: unknown) {
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
                const id = `sess_${Math.random().toString(16).slice(2)}`;
                return Promise.resolve([{ id }]);
              }
              return Promise.resolve(sel ? [{ id: 'unknown' }] : []);
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
      return fn(txApi(draft))
        .then((res) => {
          state.invites = draft.invites;
          state.admins = draft.admins;
          return res;
        })
        .catch((e) => {
          throw e;
        });
    },
  };
}

const state = {
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
};

vi.mock('../../db/client', () => {
  return {
    getDb: () => makeDb(state),
    schema: {
      adminInvites: { id: 'id', role: 'role', tokenHash: 'tokenHash', usedCount: 'usedCount', maxUses: 'maxUses', revokedAt: 'revokedAt', expiresAt: 'expiresAt' },
      adminAccounts: { __table: 'adminAccounts', id: 'id', email: 'email', role: 'role' },
      adminSessions: { __table: 'adminSessions', id: 'id' },
    },
  };
});

import signupHandler from '../../api/admin/signup/route';

function jsonBody(res: Response): Promise<unknown> {
  return res.text().then((t) => (t ? (JSON.parse(t) as unknown) : null));
}

describe('/api/admin/signup', () => {
  const envSnapshot = { ...process.env };

  beforeEach(() => {
    process.env = { ...envSnapshot };
    state.invites[0].usedCount = 0;
    state.admins = [];
  });

  afterEach(() => {
    process.env = { ...envSnapshot };
  });

  it('creates admin and consumes invite', async () => {
    const req = new Request('http://test/api/admin/signup', {
      method: 'POST',
      headers: { origin: 'https://allowed.test', 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'good-token-1234567890', email: 'A@B.com', password: '0123456789x' }),
    });
    const res = await signupHandler(req);
    expect(res.status).toBe(200);
    const body = (await jsonBody(res)) as { token: string; admin: { email: string; role: string } };
    expect(body.token).toBe('jwt_token');
    expect(body.admin.email).toBe('a@b.com');
    expect(body.admin.role).toBe('editor');
    expect(state.invites[0].usedCount).toBe(1);
  });

  it('does not consume invite when email already exists', async () => {
    state.admins = [{ id: 'adm_0', email: 'a@b.com', role: 'viewer' }];
    const req = new Request('http://test/api/admin/signup', {
      method: 'POST',
      headers: { origin: 'https://allowed.test', 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'good-token-1234567890', email: 'a@b.com', password: '0123456789x' }),
    });
    const res = await signupHandler(req);
    expect(res.status).toBe(409);
    expect(state.invites[0].usedCount).toBe(0);
  });
});
