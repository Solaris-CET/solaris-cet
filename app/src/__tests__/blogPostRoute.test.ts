// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BLOG_POST_PATH,
  BLOG_POST_PROBE,
  parseBlogPostLocale,
  parseBlogPostSlug,
} from '../../api/lib/blogPost';

const blogMocks = vi.hoisted(() => ({
  post: {
    id: 'post-1',
    slug: 'solar-guide',
    title: 'Ghid solar',
    excerpt: 'Intro',
    locale: 'ro',
    markdown: '# Hello',
    coverAssetId: null,
    publishedAt: new Date('2026-03-01T10:00:00Z'),
    updatedAt: new Date('2026-03-01T11:00:00Z'),
  } as Record<string, unknown> | null,
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
            where: async () => (blogMocks.post ? [blogMocks.post] : []),
          };
        },
      };
    },
  }),
  schema: {
    cmsPosts: {
      id: 'cmsPosts.id',
      slug: 'cmsPosts.slug',
      locale: 'cmsPosts.locale',
      status: 'cmsPosts.status',
    },
  },
}));

import blogPostRoute, { BLOG_POST_PROBE as routeProbe } from '../../api/blog/post/route';

function blogPostRequest(query = '', init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${BLOG_POST_PATH}${query}`, { ...init, headers });
}

describe('blogPost helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(BLOG_POST_PROBE.path).toBe('/api/blog/post');
    expect(routeProbe.authRequired).toBe(false);
    expect(routeProbe.defaultLocale).toBe('ro');
  });

  it('parseBlogPostSlug normalizes slug', () => {
    const params = new URLSearchParams('slug=Solar-Guide');
    expect(parseBlogPostSlug(params)).toBe('solar-guide');
  });

  it('parseBlogPostLocale defaults to ro', () => {
    expect(parseBlogPostLocale(new URLSearchParams())).toBe('ro');
  });
});

describe('/api/blog/post e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    blogMocks.post = {
      id: 'post-1',
      slug: 'solar-guide',
      title: 'Ghid solar',
      excerpt: 'Intro',
      locale: 'ro',
      markdown: '# Hello',
      coverAssetId: null,
      publishedAt: new Date('2026-03-01T10:00:00Z'),
      updatedAt: new Date('2026-03-01T11:00:00Z'),
    };
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(BLOG_POST_PATH);
    expect(src).toContain('api/blog/post/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await blogPostRoute(blogPostRequest('', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('GET without slug returns 400', async () => {
    const res = await blogPostRoute(blogPostRequest('?locale=ro', { method: 'GET' }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(BLOG_POST_PROBE.missingSlugError);
  });

  it('GET returns post when found', async () => {
    const res = await blogPostRoute(blogPostRequest('?slug=solar-guide&locale=ro', { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { post: { slug: string } };
    expect(body.post.slug).toBe('solar-guide');
  });

  it('GET returns 404 when post missing', async () => {
    blogMocks.post = null;
    const res = await blogPostRoute(blogPostRequest('?slug=missing&locale=ro', { method: 'GET' }));
    expect(res.status).toBe(404);
  });

  it('POST returns 405', async () => {
    const res = await blogPostRoute(blogPostRequest('?slug=solar-guide', { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});