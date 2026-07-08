// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CRON_WEEKLY_LEADERBOARD_PATH,
  CRON_WEEKLY_LEADERBOARD_PROBE,
  dayKeyUtc,
  weeklyCetRewardForRank,
  weeklyLeaderboardRange,
} from '../../api/lib/cronWeeklyLeaderboard';

const cronMocks = vi.hoisted(() => ({
  cronOk: true,
  existingId: null as string | null,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/cron', () => ({
  cronAuthResult: () =>
    cronMocks.cronOk ? { ok: true as const } : { ok: false as const, status: 403, error: 'Forbidden' },
}));

vi.mock('../../api/telegram/lib', () => ({
  telegramSendMessage: async () => undefined,
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from() {
          return {
            where() {
              return {
                limit: async () => (cronMocks.existingId ? [{ id: cronMocks.existingId }] : []),
                groupBy() {
                  return {
                    orderBy() {
                      return {
                        limit: async () => [],
                      };
                    },
                  };
                },
              };
            },
            groupBy() {
              return {
                orderBy() {
                  return {
                    limit: async () => [],
                  };
                },
              };
            },
          };
        },
      };
    },
    insert() {
      return {
        values() {
          return {
            returning: async () => [{ id: 'lb-empty' }],
          };
        },
      };
    },
    transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn({}),
  }),
  schema: {
    weeklyLeaderboards: { weekStart: 'weeklyLeaderboards.weekStart', id: 'weeklyLeaderboards.id' },
    pointsLedger: { createdAt: 'pointsLedger.createdAt', userId: 'pointsLedger.userId', delta: 'pointsLedger.delta' },
    users: { id: 'users.id', points: 'users.points' },
    badges: { slug: 'badges.slug', active: 'badges.active', id: 'badges.id' },
    weeklyLeaderboardEntries: {},
    weeklyRewards: { leaderboardId: 'weeklyRewards.leaderboardId', rank: 'weeklyRewards.rank' },
    userBadges: {},
    telegramLinks: { userId: 'telegramLinks.userId', chatId: 'telegramLinks.chatId' },
    userSettings: { userId: 'userSettings.userId', telegramNotificationsEnabled: 'userSettings.telegramNotificationsEnabled' },
  },
}));

import cronWeeklyLeaderboardRoute, { CRON_WEEKLY_LEADERBOARD_PROBE as routeProbe } from '../../api/cron/weekly-leaderboard/route';

function cronRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  headers.set('X-Cron-Secret', 'test-secret');
  return new Request(`http://test${CRON_WEEKLY_LEADERBOARD_PATH}`, { ...init, headers });
}

describe('cronWeeklyLeaderboard helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(CRON_WEEKLY_LEADERBOARD_PROBE.path).toBe('/api/cron/weekly-leaderboard');
    expect(routeProbe.rewardsCount).toBe(10);
  });

  it('weeklyCetRewardForRank returns tiered rewards', () => {
    expect(weeklyCetRewardForRank(0)).toBe(50);
    expect(weeklyCetRewardForRank(9)).toBe(2);
  });

  it('dayKeyUtc formats date', () => {
    expect(dayKeyUtc(new Date('2026-07-07T12:00:00Z'))).toBe('2026-07-07');
  });

  it('weeklyLeaderboardRange returns week keys', () => {
    const range = weeklyLeaderboardRange(new Date('2026-07-09T12:00:00Z'));
    expect(range.weekStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(range.weekEnd).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('/api/cron/weekly-leaderboard e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cronMocks.cronOk = true;
    cronMocks.existingId = null;
    process.env.CRON_SECRET = 'test-secret';
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(CRON_WEEKLY_LEADERBOARD_PATH);
    expect(src).toContain('api/cron/weekly-leaderboard/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await cronWeeklyLeaderboardRoute(cronRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('POST returns alreadyGenerated when leaderboard exists', async () => {
    cronMocks.existingId = 'lb-1';
    const res = await cronWeeklyLeaderboardRoute(cronRequest({ method: 'POST' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { alreadyGenerated: boolean };
    expect(body.alreadyGenerated).toBe(true);
  });

  it('POST generates empty leaderboard when no points', async () => {
    const res = await cronWeeklyLeaderboardRoute(cronRequest({ method: 'POST' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { empty: boolean; generated: boolean };
    expect(body.empty).toBe(true);
    expect(body.generated).toBe(true);
  });
});