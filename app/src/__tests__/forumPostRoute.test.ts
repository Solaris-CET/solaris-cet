// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { canModerateForumRole, canViewForumContent } from '../../api/lib/forumCommon';
import { FORUM_POST_PATH, FORUM_POST_PROBE, parseForumPostId } from '../../api/lib/forumPost';

const postMocks = vi.hoisted(() => {
  const schema = {
    forumPosts: { id: 'forumPosts.id', authorUserId: 'forumPosts.authorUserId', status: 'forumPosts.status' },
    users: { walletAddress: 'users.walletAddress', id: 'users.id' },
    forumVotes: {
      targetType: 'forumVotes.targetType',
      targetId: 'forumVotes.targetId',
      value: 'forumVotes.value',
      userId: 'forumVotes.userId',
    },
    forumComments: { postId: 'forumComments.postId', status: 'forumComments.status' },
  };

  const bag = {
    post: {
      id: 'post-1',
      authorUserId: 'user-1',
      title: 'Solar tips',
      body: 'Content here',
      status: 'visible',
      createdAt: new Date('2026-07-01T10:00:00Z'),
      updatedAt: new Date('2026-07-01T11:00:00Z'),
      lastActivityAt: new Date('2026-07-01T12:00:00Z'),
      authorWalletAddress: 'EQabc',
    } as Record<string, unknown> | null,
    authOk: false,
    role: 'user' as string,
  };

  const getDb = () => ({
    select() {
      return {
        from(table: unknown) {
          if (table === schema.forumPosts) {
            return {
              leftJoin() {
                return {
                  where() {
                    return {
                      limit: async () => (bag.post ? [bag.post] : []),
                    };
                  },
                };
              },
            };
          }
          if (table === schema.forumVotes) {
            return {
              where() {
                return {
                  limit: async () => [],
                  then(onFulfilled: (rows: unknown[]) => void, onRejected?: (err: unknown) => void) {
                    return Promise.resolve([{ score: 5 }]).then(onFulfilled, onRejected);
                  },
                };
              },
            };
          }
          if (table === schema.forumComments) {
            return {
              where() {
                return {
                  then(onFulfilled: (rows: unknown[]) => void, onRejected?: (err: unknown) => void) {
                    return Promise.resolve([{ comments: 2 }]).then(onFulfilled, onRejected);
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

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!postMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return { user: { id: 'user-1', walletAddress: 'EQabc', role: postMocks.role }, sid: 'sess-1', mfaEnabled: false };
  },
}));

vi.mock('../../db/client', () => ({
  getDb: postMocks.getDb,
  schema: postMocks.schema,
}));

import forumPostRoute, { FORUM_POST_PROBE as routeProbe } from '../../api/forum/post/route';

function forumPostRequest(query = '', init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${FORUM_POST_PATH}${query}`, { ...init, headers });
}

describe('forumPost helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(FORUM_POST_PROBE.path).toBe('/api/forum/post');
    expect(routeProbe.idParam).toBe('id');
  });

  it('parseForumPostId reads id param', () => {
    expect(parseForumPostId(new URLSearchParams('id=post-1'))).toBe('post-1');
  });

  it('canViewForumContent allows visible posts', () => {
    expect(canViewForumContent('visible', null, 'user-2', false)).toBe(true);
    expect(canModerateForumRole('moderator')).toBe(true);
  });
});

describe('/api/forum/post e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    postMocks.post = {
      id: 'post-1',
      authorUserId: 'user-1',
      title: 'Solar tips',
      body: 'Content here',
      status: 'visible',
      createdAt: new Date('2026-07-01T10:00:00Z'),
      updatedAt: new Date('2026-07-01T11:00:00Z'),
      lastActivityAt: new Date('2026-07-01T12:00:00Z'),
      authorWalletAddress: 'EQabc',
    };
    postMocks.authOk = false;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(FORUM_POST_PATH);
    expect(src).toContain('api/forum/post/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await forumPostRoute(forumPostRequest('', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET without id returns 400', async () => {
    const res = await forumPostRoute(forumPostRequest('', { method: 'GET' }));
    expect(res.status).toBe(400);
  });

  it('GET returns post when visible', async () => {
    const res = await forumPostRoute(forumPostRequest('?id=post-1', { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { post: { title: string } };
    expect(body.post.title).toBe('Solar tips');
  });

  it('GET returns 404 when post missing', async () => {
    postMocks.post = null;
    const res = await forumPostRoute(forumPostRequest('?id=missing', { method: 'GET' }));
    expect(res.status).toBe(404);
  });
});