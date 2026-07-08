// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_CETUIA_SEED_PATH,
  ADMIN_CETUIA_SEED_PROBE,
  isCetuiaSeedDatabaseConfigured,
} from '../../api/lib/adminCetuiaSeed';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'admin' as 'admin' | 'viewer',
  tokenCount: 0,
  insertCalls: 0,
}));

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
import adminCetuiaSeedRoute, { ADMIN_CETUIA_SEED_PROBE as routeProbe } from '../../api/admin/cetuia/seed/route';
import { writeAdminAudit } from '../../api/lib/adminAudit';

describe('adminCetuiaSeed helpers', () => {
  const prevDbUrl = process.env.DATABASE_URL;

  afterEach(() => {
    process.env.DATABASE_URL = prevDbUrl;
  });

  it('isCetuiaSeedDatabaseConfigured checks DATABASE_URL', () => {
    process.env.DATABASE_URL = 'postgres://local/test';
    expect(isCetuiaSeedDatabaseConfigured()).toBe(true);
    process.env.DATABASE_URL = '';
    expect(isCetuiaSeedDatabaseConfigured()).toBe(false);
  });

  it('exports stable e2e probe contract', () => {
    expect(ADMIN_CETUIA_SEED_PROBE.path).toBe('/api/admin/cetuia/seed');
    expect(routeProbe.minRole).toBe('admin');
    expect(routeProbe.totalTokens).toBe(9000);
    expect(routeProbe.methods).toEqual(['POST', 'OPTIONS']);
  });
});

describe('/api/admin/cetuia/seed e2e probe', () => {
  const prevDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.role = 'admin';
    adminMocks.tokenCount = 100;
    adminMocks.insertCalls = 0;
    process.env.DATABASE_URL = 'postgres://local/test';
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.DATABASE_URL = prevDbUrl;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_CETUIA_SEED_PATH);
    expect(src).toContain('api/admin/cetuia/seed/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminCetuiaSeedRoute(
      new Request(`http://test${ADMIN_CETUIA_SEED_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('POST requires admin auth', async () => {
    adminMocks.authOk = false;
    const res = await adminCetuiaSeedRoute(adminRequest(ADMIN_CETUIA_SEED_PATH, { method: 'POST' }));
    expect(res.status).toBe(ADMIN_CETUIA_SEED_PROBE.unauthenticatedStatus);
  });

  it('POST requires admin role', async () => {
    adminMocks.role = 'viewer';
    const res = await adminCetuiaSeedRoute(adminRequest(ADMIN_CETUIA_SEED_PATH, { method: 'POST' }));
    expect(res.status).toBe(403);
  });

  it('POST returns 503 when database is not configured', async () => {
    process.env.DATABASE_URL = '';
    const res = await adminCetuiaSeedRoute(adminRequest(ADMIN_CETUIA_SEED_PATH, { method: 'POST' }));
    expect(res.status).toBe(503);
  });

  it('POST seeds tokens and writes audit', async () => {
    const res = await adminCetuiaSeedRoute(adminRequest(ADMIN_CETUIA_SEED_PATH, { method: 'POST' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; before: number; after: number; total: number };
    expect(body.ok).toBe(true);
    expect(body.before).toBe(100);
    expect(body.after).toBe(100);
    expect(body.total).toBe(9000);
    expect(adminMocks.insertCalls).toBeGreaterThan(0);
    expect(writeAdminAudit).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({ admin: expect.objectContaining({ id: 'admin_1' }) }),
      'CETUIA_TOKENS_SEEDED',
      'cetuia_tokens',
      'all',
      expect.objectContaining({ before: 100, after: 100, total: 9000 }),
    );
  });

  it('GET returns 405', async () => {
    const res = await adminCetuiaSeedRoute(adminRequest(ADMIN_CETUIA_SEED_PATH, { method: 'GET' }));
    expect(res.status).toBe(405);
  });
});