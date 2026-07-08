// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  dayKeyUtc,
  LEADERBOARD_WEEKLY_PATH,
  LEADERBOARD_WEEKLY_PROBE,
  startOfWeekUtc,
} from '../../api/lib/leaderboardWeekly';

const leaderboardMocks = vi.hoisted(() => {
  const schema = {
    pointsLedger: { userId: 'pointsLedger.userId', delta: 'pointsLedger.delta', createdAt: 'pointsLedger.createdAt' },
    users: { id: 'users.id', walletAddress: 'users.walletAddress', points: 'users.points' },
  };

  const bag = {
    rows: [{ userId: 'user-1', xp: 120 }],
    users: [{ id: 'user-1', walletAddress: 'EQabc', points: 500 }],
  };

  const getDb = () => ({
    select() {
      return {
        from(table: unknown) {
          if (table === schema.pointsLedger) {
            return {
              where() {
                return {
                  groupBy() {
                    return {
                      orderBy() {
                        return {
                          limit: async () => bag.rows,
                        };
                      },
                    };
                  },
                };
              },
            };
          }
          if (table === schema.users) {
            return {
              where() {
                return {
                  limit: async () => bag.users,
                };
              },
            };
          }
          return { where: () => ({ limit: async () => [] }) };
        },
      };
    },
  });

  return Object.assign(bag, { schema, getDb });
});

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../db/client', () => ({
  getDb: leaderboardMocks.getDb,
  schema: leaderboardMocks.schema,
}));

import leaderboardWeeklyRoute, { LEADERBOARD_WEEKLY_PROBE as routeProbe } from '../../api/gamification/leaderboard/weekly/route';

function leaderboardRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${LEADERBOARD_WEEKLY_PATH}`, { ...init, headers });
}

describe('leaderboardWeekly helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(LEADERBOARD_WEEKLY_PROBE.path).toBe('/api/gamification/leaderboard/weekly');
    expect(routeProbe.authRequired).toBe(false);
    expect(routeProbe.listLimit).toBe(50);
  });

  it('startOfWeekUtc and dayKeyUtc format dates', () => {
    const d = new Date('2026-07-09T12:00:00Z');
    expect(dayKeyUtc(startOfWeekUtc(d))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('/api/gamification/leaderboard/weekly e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(LEADERBOARD_WEEKLY_PATH);
    expect(src).toContain('api/gamification/leaderboard/weekly/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await leaderboardWeeklyRoute(leaderboardRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET returns weekly leaderboard', async () => {
    const res = await leaderboardWeeklyRoute(leaderboardRequest({ method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; items: Array<{ rank: number; xpEarned: number }> };
    expect(body.ok).toBe(true);
    expect(body.items).toHaveLength(1);
    expect(body.items[0]?.rank).toBe(1);
    expect(body.items[0]?.xpEarned).toBe(120);
  });
});