// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_STATS_PATH,
  ADMIN_STATS_PROBE,
  adminStatsSince24h,
  normalizeAdminAvgQualityScore,
} from '../../api/lib/adminStats';

const statsMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'viewer' as 'admin' | 'editor' | 'viewer',
  selectCall: 0,
  counts: {
    users: 100,
    aiQueries24h: 42,
    aiConversations: 15,
    cmsPosts: 8,
    adminActions24h: 3,
    feedback: { total: 10, up: 7, down: 3 },
    avgScore7d: 0.85,
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
    if (!statsMocks.authOk) {
      return {
        status: probe.unauthenticatedStatus ?? 401,
        error: probe.unauthorizedError ?? 'Unauthorized',
      };
    }
    const minRole = typeof probe.minRole === 'function' ? probe.minRole(req.method) : probe.minRole;
    const ranks: Record<string, number> = { viewer: 1, editor: 2, admin: 3 };
    if ((ranks[statsMocks.role] ?? 1) < (ranks[minRole] ?? 3)) {
      return {
        status: probe.forbiddenStatus ?? 403,
        error: probe.forbiddenError ?? 'Forbidden',
      };
    }
    return { admin: { id: 'admin_1', role: statsMocks.role }, sessionId: 'sess_1' };
  },
}));
import adminStatsRoute, { ADMIN_STATS_PROBE as routeProbe } from '../../api/admin/stats/route';

describe('adminStats helpers', () => {
  it('adminStatsSince24h returns date 24h before now', () => {
    const now = Date.UTC(2026, 0, 2, 12, 0, 0);
    const since = adminStatsSince24h(now);
    expect(since.getTime()).toBe(now - ADMIN_STATS_PROBE.window24hMs);
  });

  it('normalizeAdminAvgQualityScore accepts finite numbers only', () => {
    expect(normalizeAdminAvgQualityScore(0.92)).toBe(0.92);
    expect(normalizeAdminAvgQualityScore('bad')).toBeNull();
    expect(normalizeAdminAvgQualityScore(Number.NaN)).toBeNull();
  });

  it('exports stable e2e probe contract', () => {
    expect(ADMIN_STATS_PROBE.path).toBe('/api/admin/stats');
    expect(routeProbe.minRole).toBe('viewer');
    expect(routeProbe.authRequired).toBe(true);
    expect(routeProbe.methods).toEqual(['GET', 'OPTIONS']);
  });
});

describe('/api/admin/stats e2e probe', () => {
  beforeEach(() => {
    statsMocks.authOk = true;
    statsMocks.role = 'viewer';
    statsMocks.selectCall = 0;
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_STATS_PATH);
    expect(src).toContain('api/admin/stats/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminStatsRoute(
      new Request(`http://test${ADMIN_STATS_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('GET requires admin auth', async () => {
    statsMocks.authOk = false;
    const res = await adminStatsRoute(adminRequest(ADMIN_STATS_PATH, { method: 'GET' }));
    expect(res.status).toBe(ADMIN_STATS_PROBE.unauthenticatedStatus);
  });

  it('GET returns stats payload', async () => {
    const res = await adminStatsRoute(adminRequest(ADMIN_STATS_PATH, { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      usersTotal: number;
      aiQueries24h: number;
      aiConversationsTotal: number;
      cmsPostsTotal: number;
      adminActions24h: number;
      aiFeedback24h: { total: number; up: number; down: number };
      aiAvgQualityScore7d: number | null;
    };
    expect(body.usersTotal).toBe(100);
    expect(body.aiQueries24h).toBe(42);
    expect(body.aiConversationsTotal).toBe(15);
    expect(body.cmsPostsTotal).toBe(8);
    expect(body.adminActions24h).toBe(3);
    expect(body.aiFeedback24h).toEqual({ total: 10, up: 7, down: 3 });
    expect(body.aiAvgQualityScore7d).toBe(0.85);
  });

  it('POST returns 405', async () => {
    const res = await adminStatsRoute(adminRequest(ADMIN_STATS_PATH, { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});