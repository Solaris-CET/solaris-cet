// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_CACHE_CLEAR_KEYS,
  ADMIN_CACHE_CLEAR_PATH,
  ADMIN_CACHE_CLEAR_PROBE,
} from '../../api/lib/adminCacheClear';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'admin' as 'admin' | 'viewer',
  redisDeleted: 2,
  redisOk: true,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/adminAudit', () => ({
  writeAdminAudit: vi.fn(async () => undefined),
}));

vi.mock('../../api/lib/upstashRedis', () => ({
  redisDel: vi.fn(async () => ({ ok: adminMocks.redisOk, deleted: adminMocks.redisDeleted })),
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

import adminCacheClearRoute, { ADMIN_CACHE_CLEAR_PROBE as routeProbe } from '../../api/admin/cache/clear/route';
import { writeAdminAudit } from '../../api/lib/adminAudit';
import { redisDel } from '../../api/lib/upstashRedis';

describe('adminCacheClear helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(ADMIN_CACHE_CLEAR_PROBE.path).toBe('/api/admin/cache/clear');
    expect(routeProbe.minRole).toBe('admin');
    expect(routeProbe.methods).toEqual(['POST', 'OPTIONS']);
    expect(ADMIN_CACHE_CLEAR_KEYS).toEqual(['cet-state-json', 'cet-ai:onchain:v1']);
  });
});

describe('/api/admin/cache/clear e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.role = 'admin';
    adminMocks.redisDeleted = 2;
    adminMocks.redisOk = true;
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_CACHE_CLEAR_PATH);
    expect(src).toContain('api/admin/cache/clear/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminCacheClearRoute(
      new Request(`http://test${ADMIN_CACHE_CLEAR_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('POST requires admin auth', async () => {
    adminMocks.authOk = false;
    const res = await adminCacheClearRoute(adminRequest(ADMIN_CACHE_CLEAR_PATH, { method: 'POST' }));
    expect(res.status).toBe(ADMIN_CACHE_CLEAR_PROBE.unauthenticatedStatus);
  });

  it('POST requires admin role', async () => {
    adminMocks.role = 'viewer';
    const res = await adminCacheClearRoute(adminRequest(ADMIN_CACHE_CLEAR_PATH, { method: 'POST' }));
    expect(res.status).toBe(403);
  });

  it('POST clears cache keys and writes audit', async () => {
    const res = await adminCacheClearRoute(adminRequest(ADMIN_CACHE_CLEAR_PATH, { method: 'POST' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; deleted: number; keys: string[]; redisConfigured: boolean };
    expect(body.ok).toBe(true);
    expect(body.deleted).toBe(2);
    expect(body.keys).toEqual([...ADMIN_CACHE_CLEAR_KEYS]);
    expect(body.redisConfigured).toBe(true);
    expect(redisDel).toHaveBeenCalledWith([...ADMIN_CACHE_CLEAR_KEYS]);
    expect(writeAdminAudit).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({ admin: expect.objectContaining({ id: 'admin_1' }) }),
      'CACHE_CLEARED',
      'cache',
      null,
      expect.objectContaining({ keys: [...ADMIN_CACHE_CLEAR_KEYS], deleted: 2, hasRedis: true }),
    );
  });

  it('GET returns 405', async () => {
    const res = await adminCacheClearRoute(adminRequest(ADMIN_CACHE_CLEAR_PATH, { method: 'GET' }));
    expect(res.status).toBe(405);
  });
});