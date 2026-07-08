// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  FORUM_POSTS_PATH,
  FORUM_POSTS_PROBE,
  isValidForumPostCreate,
  parseForumPostCreateBody,
  parseForumPostsLimit,
} from '../../api/lib/forumPosts';

const postsMocks = vi.hoisted(() => ({
  authOk: true,
  posts: [
    {
      id: 'post-1',
      authorUserId: 'user-1',
      title: 'Solar tips',
      body: 'Content',
      status: 'visible',
      createdAt: new Date('2026-07-01T10:00:00Z'),
      updatedAt: new Date('2026-07-01T11:00:00Z'),
      lastActivityAt: new Date('2026-07-01T12:00:00Z'),
      authorWalletAddress: 'EQabc',
    },
  ],
  insertedId: 'post-new',
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!postsMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return { user: { id: 'user-1', walletAddress: 'EQabc', role: 'user' }, sid: 'sess-1', mfaEnabled: false };
  },
}));

vi.mock('../../api/lib/points', () => ({
  awardPoints: async () => undefined,
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from() {
          return {
            leftJoin() {
              return {
                where() {
                  return {
                    orderBy() {
                      return {
                        limit: async () => postsMocks.posts,
                      };
                    },
                  };
                },
              };
            },
            where() {
              return {
                groupBy: async () => [],
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
            returning: async () => [{ id: postsMocks.insertedId }],
          };
        },
      };
    },
  }),
  schema: {
    forumPosts: { status: 'forumPosts.status', lastActivityAt: 'forumPosts.lastActivityAt', createdAt: 'forumPosts.createdAt' },
    users: { walletAddress: 'users.walletAddress', id: 'users.id' },
    forumVotes: { targetType: 'forumVotes.targetType', targetId: 'forumVotes.targetId' },
    forumComments: { postId: 'forumComments.postId', status: 'forumComments.status' },
  },
}));

import forumPostsRoute, { FORUM_POSTS_PROBE as routeProbe } from '../../api/forum/posts/route';

function forumPostsRequest(query = '', init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${FORUM_POSTS_PATH}${query}`, { ...init, headers });
}

describe('forumPosts helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(FORUM_POSTS_PROBE.path).toBe('/api/forum/posts');
    expect(routeProbe.maxLimit).toBe(50);
  });

  it('parseForumPostsLimit clamps values', () => {
    expect(parseForumPostsLimit(new URLSearchParams('limit=100'))).toBe(50);
    expect(parseForumPostsLimit(new URLSearchParams())).toBe(20);
  });

  it('isValidForumPostCreate validates title and body', () => {
    expect(isValidForumPostCreate(parseForumPostCreateBody({ title: 'Hello world', body: 'Text' }))).toBe(true);
    expect(isValidForumPostCreate(parseForumPostCreateBody({ title: 'ab', body: 'Text' }))).toBe(false);
  });
});

describe('/api/forum/posts e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    postsMocks.authOk = true;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(FORUM_POSTS_PATH);
    expect(src).toContain('api/forum/posts/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await forumPostsRoute(forumPostsRequest('', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET returns posts list', async () => {
    const res = await forumPostsRoute(forumPostsRequest('?limit=10', { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { posts: Array<{ id: string }> };
    expect(body.posts).toHaveLength(1);
  });

  it('POST creates forum post', async () => {
    const res = await forumPostsRoute(
      forumPostsRequest('', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ title: 'New topic', body: 'Hello forum' }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; postId: string };
    expect(body.ok).toBe(true);
    expect(body.postId).toBe('post-new');
  });

  it('POST with invalid title returns 400', async () => {
    const res = await forumPostsRoute(
      forumPostsRequest('', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ title: 'ab', body: 'Hello' }),
      }),
    );
    expect(res.status).toBe(400);
  });
});