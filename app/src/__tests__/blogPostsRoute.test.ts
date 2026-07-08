// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BLOG_POSTS_PATH, BLOG_POSTS_PROBE, parseBlogPostsLocale } from '../../api/lib/blogPosts';

const blogMocks = vi.hoisted(() => ({
  posts: [
    {
      id: 'post-1',
      slug: 'solar-guide',
      title: 'Ghid solar',
      excerpt: 'Intro',
      locale: 'ro',
      publishedAt: new Date('2026-03-01T10:00:00Z'),
      updatedAt: new Date('2026-03-01T11:00:00Z'),
    },
    {
      id: 'post-2',
      slug: 'cet-token',
      title: 'CET Token',
      excerpt: 'About',
      locale: 'ro',
      publishedAt: new Date('2026-02-01T10:00:00Z'),
      updatedAt: new Date('2026-02-01T11:00:00Z'),
    },
  ],
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from() {
          return {
            where() {
              return {
                orderBy() {
                  return {
                    limit: async () => blogMocks.posts,
                  };
                },
              };
            },
          };
        },
      };
    },
  }),
  schema: {
    cmsPosts: {
      id: 'cmsPosts.id',
      locale: 'cmsPosts.locale',
      status: 'cmsPosts.status',
      publishedAt: 'cmsPosts.publishedAt',
    },
  },
}));

import blogPostsRoute, { BLOG_POSTS_PROBE as routeProbe } from '../../api/blog/posts/route';

function blogPostsRequest(query = '', init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${BLOG_POSTS_PATH}${query}`, { ...init, headers });
}

describe('blogPosts helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(BLOG_POSTS_PROBE.path).toBe('/api/blog/posts');
    expect(routeProbe.maxListRows).toBe(200);
    expect(routeProbe.methods).toEqual(['GET', 'OPTIONS']);
  });

  it('parseBlogPostsLocale defaults to ro', () => {
    expect(parseBlogPostsLocale(new URLSearchParams())).toBe('ro');
    expect(parseBlogPostsLocale(new URLSearchParams('locale=en'))).toBe('en');
  });
});

describe('/api/blog/posts e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(BLOG_POSTS_PATH);
    expect(src).toContain('api/blog/posts/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await blogPostsRoute(blogPostsRequest('', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('GET returns published posts list', async () => {
    const res = await blogPostsRoute(blogPostsRequest('?locale=ro', { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { posts: Array<{ slug: string }> };
    expect(body.posts).toHaveLength(2);
    expect(body.posts[0]?.slug).toBe('solar-guide');
  });

  it('POST returns 405', async () => {
    const res = await blogPostsRoute(blogPostsRequest('', { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});