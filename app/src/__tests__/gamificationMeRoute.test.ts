// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GAMIFICATION_ME_PATH, GAMIFICATION_ME_PROBE } from '../../api/lib/gamificationMe';

const meMocks = vi.hoisted(() => {
  const schema = {
    users: { id: 'users.id', walletAddress: 'users.walletAddress', points: 'users.points', referralCode: 'users.referralCode', createdAt: 'users.createdAt' },
    userStreaks: { userId: 'userStreaks.userId', currentStreak: 'userStreaks.currentStreak', longestStreak: 'userStreaks.longestStreak', lastActiveDay: 'userStreaks.lastActiveDay' },
    userQuestProgress: { userId: 'userQuestProgress.userId', questId: 'userQuestProgress.questId', day: 'userQuestProgress.day' },
    referrals: { referrerUserId: 'referrals.referrerUserId' },
    userBadges: { userId: 'userBadges.userId', badgeId: 'userBadges.badgeId', awardedAt: 'userBadges.awardedAt' },
    badges: { id: 'badges.id', slug: 'badges.slug', active: 'badges.active', title: 'badges.title', description: 'badges.description', rarity: 'badges.rarity' },
    userInventory: { userId: 'userInventory.userId', itemId: 'userInventory.itemId', equipped: 'userInventory.equipped', acquiredAt: 'userInventory.acquiredAt' },
    shopItems: { id: 'shopItems.id', slug: 'shopItems.slug', kind: 'shopItems.kind', title: 'shopItems.title', meta: 'shopItems.meta' },
  };

  const bag = {
    authOk: true,
    userFound: true,
  };

  const getDb = () => ({
    select() {
      return {
        from(table: unknown) {
          if (table === schema.users) {
            return {
              where() {
                return {
                  limit: async () =>
                    bag.userFound
                      ? [
                          {
                            id: 'user-1',
                            walletAddress: 'EQabc',
                            points: 250,
                            referralCode: 'REF1',
                            createdAt: new Date('2026-01-01T00:00:00Z'),
                          },
                        ]
                      : [],
                };
              },
            };
          }
          if (table === schema.userStreaks) {
            return {
              where() {
                return {
                  limit: async () => [{ currentStreak: 3, longestStreak: 5, lastActiveDay: '2026-07-06' }],
                };
              },
            };
          }
          if (table === schema.referrals) {
            return {
              where() {
                return {
                  then(onFulfilled: (rows: unknown[]) => void, onRejected?: (err: unknown) => void) {
                    return Promise.resolve([{ c: 0 }]).then(onFulfilled, onRejected);
                  },
                };
              },
            };
          }
          if (table === schema.badges) {
            return {
              where() {
                return {
                  limit: async () => [{ id: 'badge-1' }],
                };
              },
            };
          }
          if (table === schema.userBadges) {
            return {
              innerJoin() {
                return {
                  where() {
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
          }
          if (table === schema.userInventory) {
            return {
              innerJoin() {
                return {
                  where() {
                    return {
                      limit: async () => [],
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
    insert() {
      return {
        values() {
          return {
            onConflictDoNothing: async () => undefined,
          };
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
    if (!meMocks.authOk || !auth.startsWith('Bearer valid-token')) return null;
    return { id: 'user-1', walletAddress: 'EQabc', role: 'user' };
  },
}));

vi.mock('../../api/gamification/lib/gamification', () => ({
  bootstrapGamification: async () => undefined,
  listActiveQuests: async () => [],
  levelProgressFromXp: (xp: number) => ({ level: 2, xp, xpForCurrentLevel: 100, xpForNextLevel: 200, progress: 0.5 }),
  levelCosmeticUnlocks: () => ({ avatarFrames: [] }),
  vipTierFrom: () => 'bronze',
  todayKeyUtc: () => '2026-07-07',
}));

vi.mock('../../db/client', () => ({
  getDb: meMocks.getDb,
  schema: meMocks.schema,
}));

import gamificationMeRoute, { GAMIFICATION_ME_PROBE as routeProbe } from '../../api/gamification/me/route';

function meRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${GAMIFICATION_ME_PATH}`, { ...init, headers });
}

describe('gamificationMe helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(GAMIFICATION_ME_PROBE.path).toBe('/api/gamification/me');
    expect(routeProbe.authRequired).toBe(true);
    expect(routeProbe.badgeSlugs).toContain('wallet-connected');
  });
});

describe('/api/gamification/me e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    meMocks.authOk = true;
    meMocks.userFound = true;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(GAMIFICATION_ME_PATH);
    expect(src).toContain('api/gamification/me/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await gamificationMeRoute(meRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET without auth returns 401', async () => {
    meMocks.authOk = false;
    const res = await gamificationMeRoute(meRequest({ method: 'GET' }));
    expect(res.status).toBe(401);
  });

  it('GET returns gamification dashboard', async () => {
    const res = await gamificationMeRoute(
      meRequest({ method: 'GET', headers: { Authorization: 'Bearer valid-token' } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; xp: number; level: number; user: { referralCode: string } };
    expect(body.ok).toBe(true);
    expect(body.xp).toBe(250);
    expect(body.level).toBe(2);
    expect(body.user.referralCode).toBe('REF1');
  });
});