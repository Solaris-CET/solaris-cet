// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { REWARDS_WEEKLY_PATH, REWARDS_WEEKLY_PROBE } from '../../api/lib/rewardsWeekly';

const rewardsMocks = vi.hoisted(() => {
  const schema = {
    weeklyRewards: {
      userId: 'weeklyRewards.userId',
      leaderboardId: 'weeklyRewards.leaderboardId',
      rank: 'weeklyRewards.rank',
      cetAmount: 'weeklyRewards.cetAmount',
      status: 'weeklyRewards.status',
      txHash: 'weeklyRewards.txHash',
      createdAt: 'weeklyRewards.createdAt',
      sentAt: 'weeklyRewards.sentAt',
    },
    weeklyLeaderboards: { id: 'weeklyLeaderboards.id', weekStart: 'weeklyLeaderboards.weekStart', weekEnd: 'weeklyLeaderboards.weekEnd' },
  };

  const bag = {
    authOk: true,
    rewards: [
      {
        weekStart: '2026-07-01',
        weekEnd: '2026-07-07',
        rank: 3,
        cetAmount: '25.5',
        status: 'sent',
        txHash: 'tx-abc',
        createdAt: new Date('2026-07-08T10:00:00Z'),
        sentAt: new Date('2026-07-08T12:00:00Z'),
      },
    ],
  };

  const getDb = () => ({
    select() {
      return {
        from(table: unknown) {
          if (table === schema.weeklyRewards) {
            return {
              innerJoin() {
                return {
                  where() {
                    return {
                      orderBy() {
                        return {
                          limit: async () => bag.rewards,
                        };
                      },
                    };
                  },
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

vi.mock('../../api/lib/authUser', () => ({
  requireUser: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!rewardsMocks.authOk || !auth.startsWith('Bearer valid-token')) return null;
    return { id: 'user-1', walletAddress: 'EQabc', role: 'user' };
  },
}));

vi.mock('../../db/client', () => ({
  getDb: rewardsMocks.getDb,
  schema: rewardsMocks.schema,
}));

import rewardsWeeklyRoute, { REWARDS_WEEKLY_PROBE as routeProbe } from '../../api/gamification/rewards/weekly/route';

function rewardsRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${REWARDS_WEEKLY_PATH}`, { ...init, headers });
}

describe('rewardsWeekly helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(REWARDS_WEEKLY_PROBE.path).toBe('/api/gamification/rewards/weekly');
    expect(routeProbe.listLimit).toBe(50);
  });
});

describe('/api/gamification/rewards/weekly e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rewardsMocks.authOk = true;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(REWARDS_WEEKLY_PATH);
    expect(src).toContain('api/gamification/rewards/weekly/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await rewardsWeeklyRoute(rewardsRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET without auth returns 401', async () => {
    rewardsMocks.authOk = false;
    const res = await rewardsWeeklyRoute(rewardsRequest({ method: 'GET' }));
    expect(res.status).toBe(401);
  });

  it('GET returns weekly rewards', async () => {
    const res = await rewardsWeeklyRoute(
      rewardsRequest({ method: 'GET', headers: { Authorization: 'Bearer valid-token' } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; rewards: Array<{ rank: number; cetAmount: string }> };
    expect(body.ok).toBe(true);
    expect(body.rewards).toHaveLength(1);
    expect(body.rewards[0]?.rank).toBe(3);
    expect(body.rewards[0]?.cetAmount).toBe('25.5');
  });
});