// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_CETUIA_TOKENS_PATH,
  ADMIN_CETUIA_TOKENS_PROBE,
  computeCetuiaAvailableCount,
  isCetuiaTokensDatabaseConfigured,
  parseCetuiaTokenId,
  parseCetuiaTokenOwner,
  parseCetuiaTokenStatus,
} from '../../api/lib/adminCetuiaTokens';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'editor' as 'admin' | 'editor' | 'viewer',
  queryStep: 0,
  responses: [
    [{ total: 9000, sold: 100, reserved: 50 }],
    [
      {
        id: 42,
        status: 'available',
        ownerWalletAddress: null,
        updatedAt: new Date('2026-03-01T10:00:00Z'),
      },
    ],
    [
      {
        id: 42,
        status: 'available',
        ownerWalletAddress: null,
        updatedAt: new Date('2026-03-01T09:00:00Z'),
      },
    ],
    [
      {
        id: 42,
        status: 'reserved',
        ownerWalletAddress: 'EQ_OWNER',
        updatedAt: new Date('2026-03-01T11:00:00Z'),
      },
    ],
  ] as unknown[][],
  updateCalls: 0,
}));

function nextDbResult(): unknown[] {
  const row = adminMocks.responses[adminMocks.queryStep] ?? [];
  adminMocks.queryStep += 1;
  return row;
}

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/adminAudit', () => ({
  writeAdminAudit: vi.fn(async () => undefined),
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

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select(arg?: unknown) {
      const isAggregate =
        arg && typeof arg === 'object' && ('total' in arg || 'sold' in arg || 'reserved' in arg);
      if (isAggregate) {
        return {
          from: async () => nextDbResult(),
        };
      }
      return {
        from() {
          return {
            where: async () => nextDbResult(),
          };
        },
      };
    },
    update() {
      adminMocks.updateCalls += 1;
      return {
        set(values: Record<string, unknown>) {
          const row = adminMocks.responses[3]?.[0] as Record<string, unknown> | undefined;
          if (row) Object.assign(row, values);
          return { where: async () => undefined };
        },
      };
    },
    insert() {
      return {
        values() {
          return { onConflictDoNothing: async () => undefined };
        },
      };
    },
  }),
  schema: {
    cetuiaTokens: {
      id: 'cetuiaTokens.id',
      status: 'cetuiaTokens.status',
      ownerWalletAddress: 'cetuiaTokens.ownerWalletAddress',
    },
  },
}));

import adminCetuiaTokensRoute, { ADMIN_CETUIA_TOKENS_PROBE as routeProbe } from '../../api/admin/cetuia/tokens/route';
import { writeAdminAudit } from '../../api/lib/adminAudit';

describe('adminCetuiaTokens helpers', () => {
  const prevDbUrl = process.env.DATABASE_URL;

  afterEach(() => {
    process.env.DATABASE_URL = prevDbUrl;
  });

  it('parseCetuiaTokenId validates range', () => {
    expect(parseCetuiaTokenId('42')).toBe(42);
    expect(parseCetuiaTokenId('0')).toBeNull();
    expect(parseCetuiaTokenId('9001')).toBeNull();
  });

  it('parseCetuiaTokenStatus accepts known statuses', () => {
    expect(parseCetuiaTokenStatus('sold')).toBe('sold');
    expect(parseCetuiaTokenStatus('pending')).toBeNull();
  });

  it('parseCetuiaTokenOwner trims and caps length', () => {
    expect(parseCetuiaTokenOwner(' EQ_OWNER ')).toBe('EQ_OWNER');
    expect(parseCetuiaTokenOwner('x'.repeat(201))).toBeNull();
  });

  it('computeCetuiaAvailableCount subtracts sold and reserved', () => {
    expect(computeCetuiaAvailableCount(9000, 100, 50)).toBe(8850);
  });

  it('isCetuiaTokensDatabaseConfigured checks DATABASE_URL', () => {
    process.env.DATABASE_URL = 'postgres://local/test';
    expect(isCetuiaTokensDatabaseConfigured()).toBe(true);
    process.env.DATABASE_URL = '';
    expect(isCetuiaTokensDatabaseConfigured()).toBe(false);
  });

  it('exports stable e2e probe contract', () => {
    expect(ADMIN_CETUIA_TOKENS_PROBE.path).toBe('/api/admin/cetuia/tokens');
    expect(routeProbe.getMinRole).toBe('viewer');
    expect(routeProbe.putMinRole).toBe('editor');
    expect(routeProbe.methods).toEqual(['GET', 'PUT', 'OPTIONS']);
  });
});

describe('/api/admin/cetuia/tokens e2e probe', () => {
  const prevDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.role = 'editor';
    adminMocks.queryStep = 0;
    adminMocks.updateCalls = 0;
    process.env.DATABASE_URL = 'postgres://local/test';
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.DATABASE_URL = prevDbUrl;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_CETUIA_TOKENS_PATH);
    expect(src).toContain('api/admin/cetuia/tokens/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminCetuiaTokensRoute(
      new Request(`http://test${ADMIN_CETUIA_TOKENS_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('PUT');
  });

  it('GET requires admin auth', async () => {
    adminMocks.authOk = false;
    const res = await adminCetuiaTokensRoute(adminRequest(ADMIN_CETUIA_TOKENS_PATH, { method: 'GET' }));
    expect(res.status).toBe(ADMIN_CETUIA_TOKENS_PROBE.unauthenticatedStatus);
  });

  it('GET returns aggregate counts', async () => {
    adminMocks.role = 'viewer';
    const res = await adminCetuiaTokensRoute(adminRequest(ADMIN_CETUIA_TOKENS_PATH, { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      counts: { total: number; available: number; reserved: number; sold: number };
      max: number;
    };
    expect(body.ok).toBe(true);
    expect(body.counts.total).toBe(9000);
    expect(body.counts.sold).toBe(100);
    expect(body.counts.reserved).toBe(50);
    expect(body.counts.available).toBe(8850);
    expect(body.max).toBe(9000);
  });

  it('GET returns single token by id', async () => {
    adminMocks.role = 'viewer';
    adminMocks.queryStep = 1;
    const res = await adminCetuiaTokensRoute(
      adminRequest(`${ADMIN_CETUIA_TOKENS_PATH}?id=42`, { method: 'GET' }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; token: { id: number; status: string } | null };
    expect(body.token?.id).toBe(42);
    expect(body.token?.status).toBe('available');
  });

  it('PUT requires editor role', async () => {
    adminMocks.role = 'viewer';
    const res = await adminCetuiaTokensRoute(
      adminRequest(ADMIN_CETUIA_TOKENS_PATH, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 42, status: 'reserved' }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it('PUT updates token and writes audit', async () => {
    adminMocks.queryStep = 2;
    const res = await adminCetuiaTokensRoute(
      adminRequest(ADMIN_CETUIA_TOKENS_PATH, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 42, status: 'reserved', ownerWalletAddress: 'EQ_OWNER' }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; token: { status: string; ownerWalletAddress: string } | null };
    expect(body.token?.status).toBe('reserved');
    expect(body.token?.ownerWalletAddress).toBe('EQ_OWNER');
    expect(adminMocks.updateCalls).toBeGreaterThan(0);
    expect(writeAdminAudit).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({ admin: expect.objectContaining({ id: 'admin_1' }) }),
      'CETUIA_TOKEN_UPDATED',
      'cetuia_tokens',
      '42',
      expect.objectContaining({
        prev: expect.objectContaining({ status: 'available' }),
        next: expect.objectContaining({ status: 'reserved', ownerWalletAddress: 'EQ_OWNER' }),
      }),
    );
  });

  it('PUT returns 400 for invalid body', async () => {
    const res = await adminCetuiaTokensRoute(
      adminRequest(ADMIN_CETUIA_TOKENS_PATH, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 42, status: 'pending' }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('POST returns 405', async () => {
    const res = await adminCetuiaTokensRoute(adminRequest(ADMIN_CETUIA_TOKENS_PATH, { method: 'POST' }));
    expect(res.status).toBe(405);
  });

  it('returns 503 when database is not configured', async () => {
    process.env.DATABASE_URL = '';
    const res = await adminCetuiaTokensRoute(adminRequest(ADMIN_CETUIA_TOKENS_PATH, { method: 'GET' }));
    expect(res.status).toBe(503);
  });
});