// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  GAMIFICATION_PROFILE_PATH,
  GAMIFICATION_PROFILE_PROBE,
  parseGamificationProfileWallet,
} from '../../api/lib/gamificationProfile';

const VALID_WALLET = 'EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX';

const profileMocks = vi.hoisted(() => {
  const schema = {
    users: { id: 'users.id', walletAddress: 'users.walletAddress', points: 'users.points' },
    userBadges: { userId: 'userBadges.userId', badgeId: 'userBadges.badgeId', awardedAt: 'userBadges.awardedAt' },
    badges: { id: 'badges.id', slug: 'badges.slug', title: 'badges.title', rarity: 'badges.rarity', active: 'badges.active' },
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
                      ? [{ id: 'user-2', walletAddress: VALID_WALLET, points: 180 }]
                      : [],
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
                          limit: async () => [
                            {
                              slug: 'solar-pioneer',
                              title: 'Solar Pioneer',
                              rarity: 'common',
                              awardedAt: new Date('2026-06-01T00:00:00Z'),
                            },
                          ],
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
    if (!profileMocks.authOk || !auth.startsWith('Bearer valid-token')) return null;
    return { id: 'user-1', walletAddress: 'EQabc', role: 'user' };
  },
}));

vi.mock('../../api/gamification/lib/gamification', () => ({
  levelProgressFromXp: (xp: number) => ({ level: 1, xp, xpForCurrentLevel: 0, xpForNextLevel: 100, progress: 0.8 }),
}));

vi.mock('../../db/client', () => ({
  getDb: profileMocks.getDb,
  schema: profileMocks.schema,
}));

import gamificationProfileRoute, { GAMIFICATION_PROFILE_PROBE as routeProbe } from '../../api/gamification/profile/route';

function profileRequest(query = '', init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${GAMIFICATION_PROFILE_PATH}${query}`, { ...init, headers });
}

describe('gamificationProfile helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(GAMIFICATION_PROFILE_PROBE.path).toBe('/api/gamification/profile');
    expect(routeProbe.walletParam).toBe('wallet');
  });

  it('parseGamificationProfileWallet reads wallet param', () => {
    expect(parseGamificationProfileWallet(new URLSearchParams(`wallet=${VALID_WALLET}`))).toBe(VALID_WALLET);
  });
});

describe('/api/gamification/profile e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profileMocks.authOk = true;
    profileMocks.userFound = true;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(GAMIFICATION_PROFILE_PATH);
    expect(src).toContain('api/gamification/profile/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await gamificationProfileRoute(profileRequest('', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET without wallet returns 400', async () => {
    const res = await gamificationProfileRoute(
      profileRequest('', { method: 'GET', headers: { Authorization: 'Bearer valid-token' } }),
    );
    expect(res.status).toBe(400);
  });

  it('GET returns public profile', async () => {
    const res = await gamificationProfileRoute(
      profileRequest(`?wallet=${encodeURIComponent(VALID_WALLET)}`, {
        method: 'GET',
        headers: { Authorization: 'Bearer valid-token' },
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; profile: { xp: number; badges: Array<{ slug: string }> } };
    expect(body.ok).toBe(true);
    expect(body.profile.xp).toBe(180);
    expect(body.profile.badges[0]?.slug).toBe('solar-pioneer');
  });
});