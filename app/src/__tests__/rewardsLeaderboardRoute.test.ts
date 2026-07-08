// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildRewardsLeaderboardPayload,
  mapAiLeaderboardRows,
  REWARDS_LEADERBOARD_PATH,
  REWARDS_LEADERBOARD_PROBE,
} from '../../api/lib/rewardsLeaderboard';

const leaderboardMocks = vi.hoisted(() => {
  const schema = {
    users: { id: 'users.id', walletAddress: 'users.walletAddress', points: 'users.points' },
    aiQueryLogs: { userId: 'aiQueryLogs.userId', createdAt: 'aiQueryLogs.createdAt' },
  };

  const bag = {
    topPoints: [{ userId: 'user-1', walletAddress: 'EQabc', points: 500 }],
    topAi: [{ userId: 'user-1', aiQueries: 12 }],
    aiUsers: [{ id: 'user-1', walletAddress: 'EQabc' }],
  };

  const getDb = () => ({
    select() {
      return {
        from(table: unknown) {
          if (table === schema.users) {
            return {
              orderBy() {
                return {
                  limit: async () => bag.topPoints,
                };
              },
              where() {
                return Promise.resolve(bag.aiUsers);
              },
            };
          }
          if (table === schema.aiQueryLogs) {
            return {
              where() {
                return {
                  groupBy() {
                    return {
                      orderBy() {
                        return {
                          limit: async () => bag.topAi,
                        };
                      },
                    };
                  },
                };
              },
            };
          }
          return { limit: async () => [] };
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

import rewardsLeaderboardRoute, { REWARDS_LEADERBOARD_PROBE as routeProbe } from '../../api/rewards/leaderboard/route';

function leaderboardRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${REWARDS_LEADERBOARD_PATH}`, { ...init, headers });
}

describe('rewardsLeaderboard helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(REWARDS_LEADERBOARD_PROBE.path).toBe('/api/rewards/leaderboard');
    expect(routeProbe.windowDays).toBe(7);
    expect(routeProbe.pointsLimit).toBe(20);
  });

  it('mapAiLeaderboardRows attaches wallet addresses', () => {
    const rows = mapAiLeaderboardRows([{ userId: 'user-1', aiQueries: 12 }], new Map([['user-1', 'EQabc']]));
    expect(rows[0]).toEqual({ userId: 'user-1', walletAddress: 'EQabc', aiQueries: 12 });
  });

  it('buildRewardsLeaderboardPayload shapes response', () => {
    const payload = buildRewardsLeaderboardPayload({
      points: [{ userId: 'user-1', walletAddress: 'EQabc', points: 500 }],
      ai: [{ userId: 'user-1', walletAddress: 'EQabc', aiQueries: 12 }],
    });
    expect(payload.windowDays).toBe(7);
    expect(payload.points).toHaveLength(1);
  });
});

describe('/api/rewards/leaderboard e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(REWARDS_LEADERBOARD_PATH);
    expect(src).toContain('api/rewards/leaderboard/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await rewardsLeaderboardRoute(leaderboardRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET returns points and AI leaderboards', async () => {
    const res = await rewardsLeaderboardRoute(leaderboardRequest({ method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { points: unknown[]; ai: unknown[]; windowDays: number };
    expect(body.points).toHaveLength(1);
    expect(body.ai).toHaveLength(1);
    expect(body.windowDays).toBe(7);
  });
});