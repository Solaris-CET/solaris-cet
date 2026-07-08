// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_INVITES_PATH,
  ADMIN_INVITES_PROBE,
  parseInviteCreateBody,
  resolveInviteStatus,
} from '../../api/lib/adminInvites';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'admin' as 'admin' | 'editor' | 'viewer',
  revokeCalls: 0,
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

const seed = vi.hoisted(() => ({
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
  ] as InviteRow[],
}));

vi.mock('../../api/lib/originGuard', () => ({
  ensureAllowedOrigin: (req: Request) => {
    const origin = req.headers.get('origin');
    if (origin === 'https://evil.test') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return { allowedOrigin: origin ?? 'https://allowed.test' };
  },
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
}));

vi.mock('../../api/lib/adminAudit', () => ({
  writeAdminAudit: vi.fn(async () => undefined),
}));

vi.mock('../../api/lib/nodeCrypto', () => ({
  sha256Hex: vi.fn(() => 'hash_abc'),
}));

vi.mock('node:crypto', () => ({
  default: {
    randomBytes: () => Buffer.from('aaaaaaaaaaaaaaaaaaaaaaaa', 'utf8').subarray(0, 24),
  },
}));

vi.mock('../../api/lib/adminAuth', () => ({
  guardAdminRoute: async (req: Request, probe: {
    minRole: string | ((method: string) => string);
    unauthenticatedStatus?: number;
    unauthorizedError?: string;
    forbiddenStatus?: number;
    forbiddenError?: string;
  }) => {
    if (!adminMocks.authOk) {
      return {
        status: probe.unauthenticatedStatus ?? 401,
        error: probe.unauthorizedError ?? 'Unauthorized',
      };
    }
    const minRole = typeof probe.minRole === 'function' ? probe.minRole(req.method) : probe.minRole;
    const ranks: Record<string, number> = { viewer: 1, editor: 2, admin: 3 };
    if ((ranks[adminMocks.role] ?? 1) < (ranks[minRole] ?? 3)) {
      return {
        status: probe.forbiddenStatus ?? 403,
        error: probe.forbiddenError ?? 'Forbidden',
      };
    }
    return { admin: { id: 'admin_1', role: adminMocks.role }, sessionId: 'sess_1' };
  },
}));

function makeDb(inviteSeed: { invites: InviteRow[] }) {
  return {
    select() {
      return {
        from() {
          return {
            orderBy() {
              return {
                limit() {
                  return Promise.resolve(inviteSeed.invites);
                },
              };
            },
            where() {
              return Promise.resolve(inviteSeed.invites.slice(0, 1));
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
          inviteSeed.invites.unshift(invite);
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
          if (inviteSeed.invites[0]) {
            inviteSeed.invites[0].revokedAt = (values.revokedAt as Date) ?? new Date();
          }
          adminMocks.revokeCalls += 1;
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

vi.mock('../../db/client', () => ({
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
}));

import adminInvitesRoute, { ADMIN_INVITES_PROBE as routeProbe } from '../../api/admin/invites/route';
import { writeAdminAudit } from '../../api/lib/adminAudit';
import { sha256Hex } from '../../api/lib/nodeCrypto';

describe('adminInvites helpers', () => {
  it('resolveInviteStatus derives status from invite fields', () => {
    const now = new Date();
    expect(resolveInviteStatus({ revokedAt: now, expiresAt: null, usedCount: 0, maxUses: 1 })).toBe('revoked');
    expect(
      resolveInviteStatus({ revokedAt: null, expiresAt: new Date(Date.now() - 1000), usedCount: 0, maxUses: 1 }),
    ).toBe('expired');
    expect(resolveInviteStatus({ revokedAt: null, expiresAt: null, usedCount: 2, maxUses: 2 })).toBe('used');
    expect(
      resolveInviteStatus({
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        usedCount: 0,
        maxUses: 1,
      }),
    ).toBe('active');
  });

  it('parseInviteCreateBody validates role and clamps limits', () => {
    expect(parseInviteCreateBody({ role: 'editor', maxUses: 2, expiresInHours: 24 })).toEqual({
      role: 'editor',
      maxUses: 2,
      expiresInHours: 24,
    });
    expect(parseInviteCreateBody({ role: 'invalid' })).toBeNull();
    expect(parseInviteCreateBody({ role: 'viewer' })).toEqual({
      role: 'viewer',
      maxUses: ADMIN_INVITES_PROBE.defaultMaxUses,
      expiresInHours: ADMIN_INVITES_PROBE.defaultExpiresInHours,
    });
  });

  it('exports stable e2e probe contract', () => {
    expect(ADMIN_INVITES_PROBE.path).toBe('/api/admin/invites');
    expect(routeProbe.minRole).toBe('admin');
    expect(routeProbe.rateLimitKey).toBe('admin-invites');
    expect(routeProbe.maxListRows).toBe(200);
    expect(routeProbe.methods).toEqual(['GET', 'POST', 'DELETE', 'OPTIONS']);
  });
});

describe('/api/admin/invites e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.role = 'admin';
    adminMocks.revokeCalls = 0;
    seed.invites = [
      {
        id: '00000000-0000-4000-8000-000000000001',
        role: 'viewer',
        maxUses: 1,
        usedCount: 0,
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
        createdAt: new Date(Date.now() - 60_000),
      },
    ];
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_INVITES_PATH);
    expect(src).toContain('api/admin/invites/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminInvitesRoute(
      new Request(`http://test${ADMIN_INVITES_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('DELETE');
  });

  it('rejects unknown origins', async () => {
    const res = await adminInvitesRoute(
      new Request(`http://test${ADMIN_INVITES_PATH}`, {
        method: 'GET',
        headers: { Authorization: 'Bearer admin-token', origin: 'https://evil.test' },
      }),
    );
    expect(res.status).toBe(403);
  });

  it('GET requires admin auth', async () => {
    adminMocks.authOk = false;
    const res = await adminInvitesRoute(adminRequest(ADMIN_INVITES_PATH, { method: 'GET' }));
    expect(res.status).toBe(ADMIN_INVITES_PROBE.unauthenticatedStatus);
  });

  it('GET requires admin role', async () => {
    adminMocks.role = 'editor';
    const res = await adminInvitesRoute(adminRequest(ADMIN_INVITES_PATH, { method: 'GET' }));
    expect(res.status).toBe(403);
  });

  it('GET returns invites list with resolved status', async () => {
    const res = await adminInvitesRoute(adminRequest(ADMIN_INVITES_PATH, { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { invites: Array<{ id: string; status: string }> };
    expect(body.invites).toHaveLength(1);
    expect(body.invites[0]?.id).toBe('00000000-0000-4000-8000-000000000001');
    expect(body.invites[0]?.status).toBe('active');
  });

  it('POST creates invite and writes audit', async () => {
    const res = await adminInvitesRoute(
      adminRequest(ADMIN_INVITES_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'editor', maxUses: 2, expiresInHours: 2 }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { token: string; invite: { id: string; role: string } };
    expect(body.invite.role).toBe('editor');
    expect(body.token).toBeTypeOf('string');
    expect(sha256Hex).toHaveBeenCalled();
    expect(writeAdminAudit).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({ admin: expect.objectContaining({ id: 'admin_1' }) }),
      'INVITE_CREATED',
      'admin_invite',
      '00000000-0000-4000-8000-000000000002',
      expect.objectContaining({ role: 'editor', maxUses: 2 }),
    );
  });

  it('DELETE revokes invite and writes audit', async () => {
    const res = await adminInvitesRoute(
      adminRequest(`${ADMIN_INVITES_PATH}?id=00000000-0000-4000-8000-000000000001`, { method: 'DELETE' }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    expect(adminMocks.revokeCalls).toBe(1);
    expect(writeAdminAudit).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({ admin: expect.objectContaining({ id: 'admin_1' }) }),
      'INVITE_REVOKED',
      'admin_invite',
      '00000000-0000-4000-8000-000000000001',
    );
  });

  it('PATCH returns 405', async () => {
    const res = await adminInvitesRoute(adminRequest(ADMIN_INVITES_PATH, { method: 'PATCH' }));
    expect(res.status).toBe(405);
  });
});