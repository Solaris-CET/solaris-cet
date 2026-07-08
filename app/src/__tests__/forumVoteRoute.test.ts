// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  FORUM_VOTE_PATH,
  FORUM_VOTE_PROBE,
  isForumVoteTargetType,
  normalizeForumVoteValue,
  parseForumVotePostBody,
  validateForumVotePostBody,
} from '../../api/lib/forumVote';

const voteMocks = vi.hoisted(() => {
  const schema = {
    forumPosts: { id: 'forumPosts.id', status: 'forumPosts.status' },
    forumComments: { id: 'forumComments.id', status: 'forumComments.status' },
    forumVotes: {
      userId: 'forumVotes.userId',
      targetType: 'forumVotes.targetType',
      targetId: 'forumVotes.targetId',
      value: 'forumVotes.value',
    },
  };

  const bag = {
    authOk: true,
    targetExists: true,
    targetType: 'post' as 'post' | 'comment',
    deleteCalled: false,
    upsertCalled: false,
  };

  const getDb = () => ({
    select() {
      return {
        from(table: unknown) {
          if (table === schema.forumPosts || table === schema.forumComments) {
            return {
              where() {
                return {
                  limit: async () =>
                    bag.targetExists ? [{ id: 'target-1', status: bag.targetType === 'post' ? 'visible' : 'visible' }] : [],
                };
              },
            };
          }
          return { where: () => ({ limit: async () => [] }) };
        },
      };
    },
    delete() {
      return {
        where: async () => {
          bag.deleteCalled = true;
        },
      };
    },
    insert() {
      return {
        values() {
          return {
            onConflictDoUpdate: async () => {
              bag.upsertCalled = true;
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

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!voteMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return { user: { id: 'user-1', walletAddress: 'EQabc', role: 'user' }, sid: 'sess-1', mfaEnabled: false };
  },
}));

vi.mock('../../api/lib/points', () => ({
  awardPoints: async () => undefined,
}));

vi.mock('../../db/client', () => ({
  getDb: voteMocks.getDb,
  schema: voteMocks.schema,
}));

import forumVoteRoute, { FORUM_VOTE_PROBE as routeProbe } from '../../api/forum/vote/route';

function voteRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${FORUM_VOTE_PATH}`, { ...init, headers });
}

describe('forumVote helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(FORUM_VOTE_PROBE.path).toBe('/api/forum/vote');
    expect(routeProbe.authRequired).toBe(true);
    expect(routeProbe.validValues).toEqual([-1, 0, 1]);
  });

  it('parseForumVotePostBody and validateForumVotePostBody', () => {
    const parsed = parseForumVotePostBody({ targetType: 'post', targetId: 'post-1', value: 1 });
    expect(validateForumVotePostBody(parsed)).toEqual({ ok: true, targetType: 'post', targetId: 'post-1', value: 1 });
    expect(isForumVoteTargetType('comment')).toBe(true);
    expect(normalizeForumVoteValue(2)).toBeNull();
  });
});

describe('/api/forum/vote e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    voteMocks.authOk = true;
    voteMocks.targetExists = true;
    voteMocks.targetType = 'post';
    voteMocks.deleteCalled = false;
    voteMocks.upsertCalled = false;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(FORUM_VOTE_PATH);
    expect(src).toContain('api/forum/vote/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await forumVoteRoute(voteRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('POST without auth returns 401', async () => {
    voteMocks.authOk = false;
    const res = await forumVoteRoute(
      voteRequest({ method: 'POST', body: JSON.stringify({ targetType: 'post', targetId: 'post-1', value: 1 }) }),
    );
    expect(res.status).toBe(401);
  });

  it('POST upvotes post', async () => {
    const res = await forumVoteRoute(
      voteRequest({
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ targetType: 'post', targetId: 'post-1', value: 1 }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; value: number };
    expect(body.ok).toBe(true);
    expect(body.value).toBe(1);
    expect(voteMocks.upsertCalled).toBe(true);
  });

  it('POST value 0 removes vote', async () => {
    const res = await forumVoteRoute(
      voteRequest({
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ targetType: 'post', targetId: 'post-1', value: 0 }),
      }),
    );
    expect(res.status).toBe(200);
    expect(voteMocks.deleteCalled).toBe(true);
  });

  it('POST with invalid targetType returns 400', async () => {
    const res = await forumVoteRoute(
      voteRequest({
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ targetType: 'user', targetId: 'x', value: 1 }),
      }),
    );
    expect(res.status).toBe(400);
  });
});