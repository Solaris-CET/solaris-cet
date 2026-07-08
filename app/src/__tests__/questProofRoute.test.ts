// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  isValidQuestProofPost,
  parseQuestProofPostBody,
  QUEST_PROOF_PATH,
  QUEST_PROOF_PROBE,
} from '../../api/lib/questProof';

const proofMocks = vi.hoisted(() => {
  const schema = {
    quests: {
      id: 'quests.id',
      slug: 'quests.slug',
      targetCount: 'quests.targetCount',
      requiresProof: 'quests.requiresProof',
      active: 'quests.active',
    },
    userQuestProgress: {
      userId: 'userQuestProgress.userId',
      questId: 'userQuestProgress.questId',
      day: 'userQuestProgress.day',
    },
  };

  const bag = {
    authOk: true,
    questFound: true,
    requiresProof: true,
    upserted: false,
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
                      ? [{ id: 'quest-1', targetCount: 1, requiresProof: bag.requiresProof, active: true }]
                      : [],
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
              bag.upserted = true;
            },
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
    if (!proofMocks.authOk || !auth.startsWith('Bearer valid-token')) return null;
    return { id: 'user-1', walletAddress: 'EQabc', role: 'user' };
  },
}));

vi.mock('../../api/gamification/lib/gamification', () => ({
  bootstrapGamification: async () => undefined,
}));

vi.mock('../../db/client', () => ({
  getDb: proofMocks.getDb,
  schema: proofMocks.schema,
}));

import questProofRoute, { QUEST_PROOF_PROBE as routeProbe } from '../../api/gamification/quests/proof/route';

function proofRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${QUEST_PROOF_PATH}`, { ...init, headers });
}

describe('questProof helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(QUEST_PROOF_PROBE.path).toBe('/api/gamification/quests/proof');
    expect(routeProbe.authRequired).toBe(true);
  });

  it('parseQuestProofPostBody and isValidQuestProofPost', () => {
    const parsed = parseQuestProofPostBody({ questSlug: 'photo-proof', proofUrl: 'https://proof.test/img.png' });
    expect(isValidQuestProofPost(parsed)).toBe(true);
    expect(isValidQuestProofPost(parseQuestProofPostBody({ questSlug: 'x' }))).toBe(false);
  });
});

describe('/api/gamification/quests/proof e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    proofMocks.authOk = true;
    proofMocks.questFound = true;
    proofMocks.requiresProof = true;
    proofMocks.upserted = false;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(QUEST_PROOF_PATH);
    expect(src).toContain('api/gamification/quests/proof/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await questProofRoute(proofRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('POST without auth returns 401', async () => {
    proofMocks.authOk = false;
    const res = await questProofRoute(
      proofRequest({
        method: 'POST',
        body: JSON.stringify({ questSlug: 'photo-proof', proofUrl: 'https://proof.test' }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it('POST submits quest proof', async () => {
    const res = await questProofRoute(
      proofRequest({
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ questSlug: 'photo-proof', proofUrl: 'https://proof.test/img.png' }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; pendingReview: boolean };
    expect(body.ok).toBe(true);
    expect(body.pendingReview).toBe(true);
    expect(proofMocks.upserted).toBe(true);
  });
});