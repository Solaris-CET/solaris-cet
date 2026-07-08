// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  FORUM_COMMENTS_PATH,
  FORUM_COMMENTS_PROBE,
  isValidForumCommentPost,
  parseForumCommentPostBody,
  parseForumCommentsPostId,
} from '../../api/lib/forumComments';

const commentMocks = vi.hoisted(() => {
  const schema = {
    forumPosts: { id: 'forumPosts.id', status: 'forumPosts.status', authorUserId: 'forumPosts.authorUserId' },
    forumComments: { postId: 'forumComments.postId', id: 'forumComments.id', status: 'forumComments.status' },
    users: { walletAddress: 'users.walletAddress', id: 'users.id' },
    forumVotes: { targetType: 'forumVotes.targetType', targetId: 'forumVotes.targetId', userId: 'forumVotes.userId' },
  };

  const state = {
    authOk: true,
    role: 'user' as string,
    post: { id: 'post-1', status: 'visible', authorUserId: 'user-1' },
    comments: [
      {
        id: 'cmt-1',
        postId: 'post-1',
        authorUserId: 'user-1',
        parentCommentId: null,
        body: 'Nice post',
        status: 'visible',
        createdAt: new Date('2026-07-07T10:00:00Z'),
        updatedAt: new Date('2026-07-07T10:00:00Z'),
        authorWalletAddress: 'EQabc',
      },
    ],
    insertedId: 'cmt-new',
  };

  const getDb = () => ({
    select() {
      return {
        from(table: unknown) {
          if (table === schema.forumPosts) {
            return {
              where() {
                return {
                  limit: async () => [state.post],
                };
              },
            };
          }
          if (table === schema.forumVotes) {
            return {
              where() {
                return {
                  groupBy: async () => [],
                  then(onFulfilled: (rows: unknown[]) => void, onRejected?: (err: unknown) => void) {
                    return Promise.resolve([]).then(onFulfilled, onRejected);
                  },
                };
              },
            };
          }
          if (table === schema.forumComments) {
            return {
              leftJoin() {
                return {
                  where() {
                    return {
                      orderBy() {
                        return {
                          limit: async () => state.comments,
                        };
                      },
                      limit: async () => [],
                    };
                  },
                };
              },
              where() {
                return {
                  limit: async () => [],
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
            returning: async () => [{ id: state.insertedId }],
          };
        },
      };
    },
    update() {
      return {
        set() {
          return {
            where: async () => undefined,
          };
        },
      };
    },
  });

  return { ...state, schema, getDb };
});

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!commentMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return { user: { id: 'user-1', walletAddress: 'EQabc', role: commentMocks.role }, sid: 'sess-1', mfaEnabled: false };
  },
}));

vi.mock('../../api/lib/points', () => ({
  awardPoints: async () => undefined,
}));

vi.mock('../../db/client', () => ({
  getDb: commentMocks.getDb,
  schema: commentMocks.schema,
}));

import forumCommentsRoute, { FORUM_COMMENTS_PROBE as routeProbe } from '../../api/forum/comments/route';

function commentsRequest(query = '', init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${FORUM_COMMENTS_PATH}${query}`, { ...init, headers });
}

describe('forumComments helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(FORUM_COMMENTS_PROBE.path).toBe('/api/forum/comments');
    expect(routeProbe.maxCommentLength).toBe(2000);
  });

  it('parseForumCommentsPostId and parseForumCommentPostBody', () => {
    expect(parseForumCommentsPostId(new URLSearchParams('postId=post-1'))).toBe('post-1');
    expect(isValidForumCommentPost(parseForumCommentPostBody({ body: 'Hi' }))).toBe(true);
  });
});

describe('/api/forum/comments e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    commentMocks.authOk = true;
    commentMocks.role = 'user';
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(FORUM_COMMENTS_PATH);
    expect(src).toContain('api/forum/comments/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await forumCommentsRoute(commentsRequest('', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET without postId returns 400', async () => {
    const res = await forumCommentsRoute(commentsRequest('', { method: 'GET' }));
    expect(res.status).toBe(400);
  });

  it('GET returns comments for post', async () => {
    const res = await forumCommentsRoute(commentsRequest('?postId=post-1', { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { comments: Array<{ id: string }> };
    expect(body.comments).toHaveLength(1);
  });

  it('POST creates comment when authenticated', async () => {
    const res = await forumCommentsRoute(
      commentsRequest('?postId=post-1', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ body: 'Great insight' }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; commentId: string };
    expect(body.ok).toBe(true);
    expect(body.commentId).toBe('cmt-new');
  });
});