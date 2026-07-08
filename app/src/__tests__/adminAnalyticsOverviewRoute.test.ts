// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  activationRate,
  ADMIN_ANALYTICS_OVERVIEW_PATH,
  ADMIN_ANALYTICS_OVERVIEW_PROBE,
  addDaysUtc,
  dateToDayUtc,
  parseOverviewDaysParam,
  sessionQueryPercentiles,
} from '../../api/lib/adminAnalyticsOverview';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'viewer' as 'admin' | 'viewer',
  queryStep: 0,
  responses: [
    [{ c: 100 }],
    [{ c: 40 }],
    [{ c: 10 }],
    [{ c: 100 }],
    [{ c: 25 }],
    [{ cnt: 4 }, { cnt: 2 }],
    [{ anonId: 'anon-1', day: '2026-02-01' }, { anonId: 'anon-1', day: '2026-02-02' }],
    [{ userId: 'dev-1' }],
    [{ userId: 'u-whale', total: '500' }, { userId: 'u-retail', total: '5' }],
    [{ c: 120 }],
    [{ userId: 'power-1', c: 15 }],
    [{ id: 'power-1', walletAddress: 'EQ_POWER' }],
  ] as unknown[][],
}));

function nextDbResult(): unknown[] {
  const row = adminMocks.responses[adminMocks.queryStep] ?? [{ c: 0 }];
  adminMocks.queryStep += 1;
  return row;
}

function terminalChain() {
  const result = nextDbResult();
  const afterGroupBy = {
    orderBy() {
      return {
        limit: async () => result,
      };
    },
    then(onFulfilled: (rows: unknown[]) => void, onRejected?: (err: unknown) => void) {
      return Promise.resolve(result).then(onFulfilled, onRejected);
    },
  };
  return {
    groupBy() {
      return afterGroupBy;
    },
    orderBy() {
      return {
        limit: async () => result,
        groupBy() {
          return afterGroupBy;
        },
      };
    },
    then(onFulfilled: (rows: unknown[]) => void, onRejected?: (err: unknown) => void) {
      return Promise.resolve(result).then(onFulfilled, onRejected);
    },
  };
}

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
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
import adminAnalyticsOverviewRoute, { ADMIN_ANALYTICS_OVERVIEW_PROBE as routeProbe } from '../../api/admin/analytics/overview/route';

describe('adminAnalyticsOverview helpers', () => {
  it('parseOverviewDaysParam clamps days query', () => {
    expect(parseOverviewDaysParam(new URLSearchParams('days=7'))).toBe(7);
    expect(parseOverviewDaysParam(new URLSearchParams('days=500'))).toBe(90);
    expect(parseOverviewDaysParam(new URLSearchParams())).toBe(30);
  });

  it('date helpers shift UTC days', () => {
    const day = dateToDayUtc(new Date('2026-03-01T12:00:00Z'));
    expect(day).toBe('2026-03-01');
    expect(addDaysUtc(day, 2)).toBe('2026-03-03');
  });

  it('sessionQueryPercentiles and activationRate compute metrics', () => {
    expect(sessionQueryPercentiles([1, 2, 10])).toEqual({ avg: 13 / 3, p50: 2, p90: 2 });
    expect(activationRate(25, 100)).toBe(0.25);
    expect(activationRate(1, 0)).toBe(0);
  });

  it('exports stable e2e probe contract', () => {
    expect(ADMIN_ANALYTICS_OVERVIEW_PROBE.path).toBe('/api/admin/analytics/overview');
    expect(routeProbe.minRole).toBe('viewer');
    expect(routeProbe.methods).toEqual(['GET', 'OPTIONS']);
  });
});

describe('/api/admin/analytics/overview e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.role = 'viewer';
    adminMocks.queryStep = 0;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_ANALYTICS_OVERVIEW_PATH);
    expect(src).toContain('api/admin/analytics/overview/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminAnalyticsOverviewRoute(
      new Request(`http://test${ADMIN_ANALYTICS_OVERVIEW_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('GET requires admin auth', async () => {
    adminMocks.authOk = false;
    const res = await adminAnalyticsOverviewRoute(adminRequest(ADMIN_ANALYTICS_OVERVIEW_PATH, { method: 'GET' }));
    expect(res.status).toBe(ADMIN_ANALYTICS_OVERVIEW_PROBE.unauthenticatedStatus);
  });

  it('GET returns analytics overview payload', async () => {
    const res = await adminAnalyticsOverviewRoute(
      adminRequest(`${ADMIN_ANALYTICS_OVERVIEW_PATH}?days=14`, { method: 'GET' }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      windowDays: number;
      funnel: Array<{ step: string; users: number }>;
      activation: { rate: number };
      segments: Array<{ label: string }>;
      powerUsers: Array<{ walletAddress: string }>;
    };
    expect(body.windowDays).toBe(14);
    expect(body.funnel.map((f) => f.step)).toEqual(['landing', 'connect', 'stake']);
    expect(body.funnel[0]?.users).toBe(100);
    expect(body.activation.rate).toBe(0.25);
    expect(body.segments.some((s) => s.label === 'developers')).toBe(true);
    expect(body.powerUsers[0]?.walletAddress).toBe('EQ_POWER');
  });

  it('POST returns 405', async () => {
    const res = await adminAnalyticsOverviewRoute(adminRequest(ADMIN_ANALYTICS_OVERVIEW_PATH, { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});