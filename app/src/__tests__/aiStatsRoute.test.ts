// @vitest-environment node
import { authRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AI_STATS_PATH,
  AI_STATS_PROBE,
  aiStatsSince24h,
  aiStatsSince7d,
  normalizeAiStatsAvgScore,
} from '../../api/lib/aiStats';

const statsMocks = vi.hoisted(() => ({
  authOk: true,
  selectCall: 0,
  counts: { q24h: 3, q7d: 12, avg: 0.91, fb: { total: 4, up: 3, down: 1 } },
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withUpstashRateLimit: async () => null,
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!statsMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return { user: { id: 'user-1', role: 'user' }, sid: null, mfaEnabled: false };
  },
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select(arg?: unknown) {
      const isAvg = arg && typeof arg === 'object' && 'avgScore7d' in arg;
      const isFb = arg && typeof arg === 'object' && 'total' in arg;
      if (isAvg) {
        return {
          from() {
            return {
              where: async () => [{ avgScore7d: statsMocks.counts.avg }],
            };
          },
        };
      }
      if (isFb) {
        return {
          from() {
            return {
              where: async () => [statsMocks.counts.fb],
            };
          },
        };
      }
      const call = statsMocks.selectCall++;
      const value = call === 0 ? statsMocks.counts.q24h : statsMocks.counts.q7d;
      return {
        from() {
          return {
            where: async () => [{ c: value }],
          };
        },
      };
    },
  }),
  schema: {
    aiQueryLogs: { userId: 'aiQueryLogs.userId', createdAt: 'aiQueryLogs.createdAt', qualityScore: 'aiQueryLogs.qualityScore' },
    aiFeedback: { userId: 'aiFeedback.userId', createdAt: 'aiFeedback.createdAt', rating: 'aiFeedback.rating' },
  },
}));

import aiStatsRoute, { AI_STATS_PROBE as routeProbe } from '../../api/ai/stats/route';

describe('aiStats helpers', () => {
  it('window helpers return expected offsets', () => {
    const now = Date.UTC(2026, 0, 2, 12, 0, 0);
    expect(aiStatsSince24h(now).getTime()).toBe(now - AI_STATS_PROBE.window24hMs);
    expect(aiStatsSince7d(now).getTime()).toBe(now - AI_STATS_PROBE.window7dMs);
  });

  it('normalizeAiStatsAvgScore accepts finite numbers only', () => {
    expect(normalizeAiStatsAvgScore(0.88)).toBe(0.88);
    expect(normalizeAiStatsAvgScore('bad')).toBeNull();
  });

  it('exports stable e2e probe contract', () => {
    expect(AI_STATS_PROBE.path).toBe('/api/ai/stats');
    expect(routeProbe.authRequired).toBe(true);
    expect(routeProbe.methods).toEqual(['GET', 'OPTIONS']);
  });
});

describe('/api/ai/stats e2e probe', () => {
  const prevDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    statsMocks.authOk = true;
    statsMocks.selectCall = 0;
    process.env.DATABASE_URL = 'postgres://test';
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.DATABASE_URL = prevDbUrl;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(AI_STATS_PATH);
    expect(src).toContain('api/ai/stats/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await aiStatsRoute(authRequest(AI_STATS_PATH, { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('GET requires auth', async () => {
    statsMocks.authOk = false;
    const res = await aiStatsRoute(authRequest(AI_STATS_PATH, { method: 'GET' }));
    expect(res.status).toBe(401);
  });

  it('GET returns user stats', async () => {
    const res = await aiStatsRoute(authRequest(AI_STATS_PATH, { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      queries24h: number;
      queries7d: number;
      avgQualityScore7d: number | null;
      feedback7d: { total: number; up: number; down: number };
    };
    expect(body.queries24h).toBe(3);
    expect(body.queries7d).toBe(12);
    expect(body.avgQualityScore7d).toBe(0.91);
    expect(body.feedback7d).toEqual({ total: 4, up: 3, down: 1 });
  });

  it('POST returns 405', async () => {
    const res = await aiStatsRoute(authRequest(AI_STATS_PATH, { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});