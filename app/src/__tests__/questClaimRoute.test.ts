// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  isValidQuestClaimPost,
  parseQuestClaimPostBody,
  QUEST_CLAIM_PATH,
  QUEST_CLAIM_PROBE,
} from '../../api/lib/questClaim';

const claimMocks = vi.hoisted(() => {
  const schema = {
    quests: {
      id: 'quests.id',
      slug: 'quests.slug',
      kind: 'quests.kind',
      targetCount: 'quests.targetCount',
      pointsReward: 'quests.pointsReward',
      requiresProof: 'quests.requiresProof',
      active: 'quests.active',
    },
    userQuestProgress: {
      id: 'userQuestProgress.id',
      userId: 'userQuestProgress.userId',
      questId: 'userQuestProgress.questId',
      day: 'userQuestProgress.day',
      progress: 'userQuestProgress.progress',
      status: 'userQuestProgress.status',
    },
  };

  const bag = {
    authOk: true,
    questFound: true,
    progress: 3,
    status: 'in_progress' as string,
    progressUpserted: false,
    transactionCalled: false,
  };

  const getDb = () => ({
    select() {
      return {
        from(table: unknown) {
          if (table === schema.quests) {
            return {
              where() {
                return {
                  limit: async () =>
                    bag.questFound
                      ? [
                          {
                            id: 'quest-1',
                            slug: 'daily-login',
                            kind: 'daily',
                            targetCount: 1,
                            pointsReward: 10,
                            requiresProof: false,
                          },
                        ]
                      : [],
                };
              },
            };
          }
          if (table === schema.userQuestProgress) {
            return {
              where() {
                return {
                  limit: async () => [{ id: 'prog-1', progress: bag.progress, status: bag.status }],
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
            onConflictDoUpdate: async () => {
              bag.progressUpserted = true;
            },
          };
        },
      };
    },
    transaction: async (fn: (tx: ReturnType<typeof getDb>) => Promise<{ awarded: boolean }>) => {
      bag.transactionCalled = true;
      return fn(getDb());
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
    if (!claimMocks.authOk || !auth.startsWith('Bearer valid-token')) return null;
    return { id: 'user-1', walletAddress: 'EQabc', role: 'user' };
  },
}));

vi.mock('../../api/lib/points', () => ({
  awardPoints: async () => ({ awarded: true }),
}));

vi.mock('../../api/gamification/lib/gamification', () => ({
  bootstrapGamification: async () => undefined,
  todayKeyUtc: () => '2026-07-07',
}));

vi.mock('../../db/client', () => ({
  getDb: claimMocks.getDb,
  schema: claimMocks.schema,
}));

import questClaimRoute, { QUEST_CLAIM_PROBE as routeProbe } from '../../api/gamification/quests/claim/route';

function claimRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${QUEST_CLAIM_PATH}`, { ...init, headers });
}

describe('questClaim helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(QUEST_CLAIM_PROBE.path).toBe('/api/gamification/quests/claim');
    expect(routeProbe.authRequired).toBe(true);
  });

  it('parseQuestClaimPostBody and isValidQuestClaimPost', () => {
    const parsed = parseQuestClaimPostBody({ questSlug: 'daily-login' });
    expect(isValidQuestClaimPost(parsed)).toBe(true);
    expect(isValidQuestClaimPost(parseQuestClaimPostBody({}))).toBe(false);
  });
});

describe('/api/gamification/quests/claim e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    claimMocks.authOk = true;
    claimMocks.questFound = true;
    claimMocks.progress = 3;
    claimMocks.status = 'in_progress';
    claimMocks.progressUpserted = false;
    claimMocks.transactionCalled = false;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(QUEST_CLAIM_PATH);
    expect(src).toContain('api/gamification/quests/claim/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await questClaimRoute(claimRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('POST without auth returns 401', async () => {
    claimMocks.authOk = false;
    const res = await questClaimRoute(
      claimRequest({ method: 'POST', body: JSON.stringify({ questSlug: 'daily-login' }) }),
    );
    expect(res.status).toBe(401);
  });

  it('POST claims completed quest', async () => {
    const res = await questClaimRoute(
      claimRequest({
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ questSlug: 'daily-login' }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; claimed: boolean; delta: number };
    expect(body.ok).toBe(true);
    expect(body.claimed).toBe(true);
    expect(body.delta).toBe(10);
    expect(claimMocks.transactionCalled).toBe(true);
  });

  it('POST with incomplete quest returns 409', async () => {
    claimMocks.progress = 0;
    const res = await questClaimRoute(
      claimRequest({
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ questSlug: 'daily-login' }),
      }),
    );
    expect(res.status).toBe(409);
  });
});