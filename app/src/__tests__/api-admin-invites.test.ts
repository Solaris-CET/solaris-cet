import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
}));

vi.mock('../../api/lib/adminAuth', () => ({
  requireAdminAuth: async () => ({ admin: { id: 'admin_1', role: 'admin' }, sessionId: 'sess_1' }),
  requireAdminRole: () => ({ ok: true }),
}));

vi.mock('../../api/lib/adminAudit', () => ({
  writeAdminAudit: async () => undefined,
}));

vi.mock('../../api/lib/nodeCrypto', () => ({
  sha256Hex: () => 'hash_abc',
}));

vi.mock('node:crypto', () => ({
  default: {
    randomBytes: () => Buffer.from('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'utf8').subarray(0, 24),
  },
}));

type InviteRow = {
  id: string;
  role: 'admin' | 'editor' | 'viewer';
  maxUses: number;
  usedCount: number;
  expiresAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
};

function makeDb(seed: { invites: InviteRow[] }) {
  return {
    select() {
      return {
        from() {
          return {
            orderBy() {
              return {
                limit() {
                  return Promise.resolve(seed.invites);
                },
              };
            },
            where() {
              return Promise.resolve(seed.invites.slice(0, 1));
            },
          };
        },
      };
    },
    insert() {
      return {
        values(values: Record<string, unknown>) {
          const now = new Date();
          const invite: InviteRow = {
            id: '00000000-0000-4000-8000-000000000002',
            role: String(values.role) as InviteRow['role'],
            maxUses: Number(values.maxUses),
            usedCount: 0,
            expiresAt: values.expiresAt instanceof Date ? values.expiresAt : now,
            revokedAt: null,
            createdAt: now,
          };
          seed.invites.unshift(invite);
          return {
            returning() {
              return Promise.resolve([invite]);
            },
          };
        },
      };
    },
    update() {
      return {
        set(values: Record<string, unknown>) {
          if (seed.invites[0]) {
            seed.invites[0].revokedAt = (values.revokedAt as Date) ?? new Date();
          }
          return {
            where() {
              return Promise.resolve();
            },
          };
        },
      };
    },
  };
}

const seed = {
  invites: [
    {
      id: '00000000-0000-4000-8000-000000000001',
      role: 'viewer' as const,
      maxUses: 1,
      usedCount: 0,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date(Date.now() - 60_000),
    },
  ],
};

vi.mock('../../db/client', () => {
  return {
    getDb: () => makeDb(seed),
    schema: {
      adminInvites: {
        id: 'id',
        role: 'role',
        maxUses: 'maxUses',
        usedCount: 'usedCount',
        expiresAt: 'expiresAt',
        revokedAt: 'revokedAt',
        createdAt: 'createdAt',
        createdByAdminId: 'createdByAdminId',
      },
    },
  };
});

import invitesHandler from '../../api/admin/invites/route';

function jsonBody(res: Response): Promise<unknown> {
  return res.text().then((t) => (t ? (JSON.parse(t) as unknown) : null));
}

describe('/api/admin/invites', () => {
  const envSnapshot = { ...process.env };

  beforeEach(() => {
    process.env = { ...envSnapshot };
  });

  afterEach(() => {
    process.env = { ...envSnapshot };
  });

  it('OPTIONS returns 204 with CORS headers', async () => {
    const req = new Request('http://test/api/admin/invites', {
      method: 'OPTIONS',
      headers: { origin: 'https://x.test' },
    });
    const res = await invitesHandler(req);
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://allowed.test');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('rejects unknown origins', async () => {
    const req = new Request('http://test/api/admin/invites', {
      method: 'GET',
      headers: { origin: 'https://evil.test' },
    });
    const res = await invitesHandler(req);
    expect(res.status).toBe(403);
  });

  it('GET returns invites list', async () => {
    const req = new Request('http://test/api/admin/invites', {
      method: 'GET',
      headers: { origin: 'https://allowed.test', Authorization: 'Bearer token' },
    });
    const res = await invitesHandler(req);
    expect(res.status).toBe(200);
    const body = (await jsonBody(res)) as { invites: Array<{ id: string; status: string }> };
    expect(Array.isArray(body.invites)).toBe(true);
    expect(body.invites[0]?.id).toBeDefined();
    expect(body.invites[0]?.status).toBeDefined();
  });

  it('POST creates an invite and returns token', async () => {
    const req = new Request('http://test/api/admin/invites', {
      method: 'POST',
      headers: { origin: 'https://allowed.test', 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: JSON.stringify({ role: 'editor', maxUses: 2, expiresInHours: 2 }),
    });
    const res = await invitesHandler(req);
    expect(res.status).toBe(200);
    const body = (await jsonBody(res)) as { token: string; invite: { id: string; role: string } };
    expect(body.invite.role).toBe('editor');
    expect(body.token).toBeTypeOf('string');
    expect(body.token.length).toBeGreaterThan(10);
  });

  it('DELETE revokes an invite', async () => {
    const u = new URL('http://test/api/admin/invites');
    u.searchParams.set('id', '00000000-0000-4000-8000-000000000001');
    const req = new Request(u.toString(), {
      method: 'DELETE',
      headers: { origin: 'https://allowed.test', Authorization: 'Bearer token' },
    });
    expect(new URL(req.url).searchParams.get('id')).toBe('00000000-0000-4000-8000-000000000001');
    const res = await invitesHandler(req);
    expect(res.status).toBe(200);
    const body = (await jsonBody(res)) as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  it('DELETE rejects invalid id', async () => {
    const u = new URL('http://test/api/admin/invites');
    u.searchParams.set('id', 'not-a-uuid');
    const req = new Request(u.toString(), {
      method: 'DELETE',
      headers: { origin: 'https://allowed.test', Authorization: 'Bearer token' },
    });
    const res = await invitesHandler(req);
    expect(res.status).toBe(400);
    const body = (await jsonBody(res)) as { error: string };
    expect(body.error).toBe('Invalid id');
  });
});
