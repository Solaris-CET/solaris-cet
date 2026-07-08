// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_CMS_POSTS_PATH,
  ADMIN_CMS_POSTS_PROBE,
  normalizeCmsPostSlug,
  normalizeCmsPostStatus,
  parseCmsPostCreateBody,
  parseCmsPostDeleteId,
  parseCmsPostsLocale,
} from '../../api/lib/adminCmsPosts';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'editor' as 'admin' | 'editor' | 'viewer',
  posts: [
    {
      id: 'post-1',
      slug: 'solar-guide',
      title: 'Ghid solar',
      excerpt: 'Intro',
      locale: 'ro',
      status: 'draft',
      markdown: '# Hello',
      updatedAt: new Date('2026-03-01T11:00:00Z'),
      publishedAt: null,
    },
  ],
  existingPost: null as (typeof adminMocks.posts)[number] | null,
  deleted: false,
  updateCalls: 0,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/adminAudit', () => ({
  writeAdminAudit: vi.fn(async () => undefined),
}));

vi.mock('../../api/lib/adminAuth', () => ({
  guardAdminRoute: async (req: Request, probe: {
    minRole: string | ((method: string) => string);
    unauthenticatedStatus?: number;
    unauthorizedError?: string;
    forbiddenStatus?: number;
    forbiddenError?: string;
  }) => {
    if (!adminMocks.authOk) {
      return {
        status: probe.unauthenticatedStatus ?? 401,
        error: probe.unauthorizedError ?? 'Unauthorized',
      };
    }
    const minRole = typeof probe.minRole === 'function' ? probe.minRole(req.method) : probe.minRole;
    const ranks: Record<string, number> = { viewer: 1, editor: 2, admin: 3 };
    if ((ranks[adminMocks.role] ?? 1) < (ranks[minRole] ?? 3)) {
      return {
        status: probe.forbiddenStatus ?? 403,
        error: probe.forbiddenError ?? 'Forbidden',
      };
    }
    return { admin: { id: 'admin_1', role: adminMocks.role }, sessionId: 'sess_1' };
  },
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
                    limit: async () => adminMocks.posts,
                  };
                },
                then(onFulfilled: (rows: unknown[]) => void, onRejected?: (err: unknown) => void) {
                  const rows = adminMocks.existingPost ? [adminMocks.existingPost] : [];
                  return Promise.resolve(rows).then(onFulfilled, onRejected);
                },
              };
            },
            orderBy() {
              return {
                limit: async () => adminMocks.posts,
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
            returning: async () => [
              {
                id: 'post-new',
                slug: 'new-post',
                title: 'New Post',
                excerpt: '',
                locale: 'ro',
                status: 'draft',
                markdown: '',
                updatedAt: new Date(),
                publishedAt: null,
              },
            ],
          };
        },
      };
    },
    update() {
      adminMocks.updateCalls += 1;
      return { set: () => ({ where: async () => undefined }) };
    },
    delete() {
      return {
        where: async () => {
          adminMocks.deleted = true;
        },
      };
    },
  }),
  schema: {
    cmsPosts: {
      id: 'cmsPosts.id',
      slug: 'cmsPosts.slug',
      locale: 'cmsPosts.locale',
      updatedAt: 'cmsPosts.updatedAt',
    },
  },
}));

import adminCmsPostsRoute, { ADMIN_CMS_POSTS_PROBE as routeProbe } from '../../api/admin/cms/posts/route';
import { writeAdminAudit } from '../../api/lib/adminAudit';

describe('adminCmsPosts helpers', () => {
  it('normalizeCmsPostSlug validates slug pattern', () => {
    expect(normalizeCmsPostSlug('Solar-Guide')).toBe('solar-guide');
    expect(normalizeCmsPostSlug('ab')).toBeNull();
  });

  it('normalizeCmsPostStatus maps unknown to draft', () => {
    expect(normalizeCmsPostStatus('published')).toBe('published');
    expect(normalizeCmsPostStatus('pending')).toBe('draft');
  });

  it('parseCmsPostCreateBody validates slug and title', () => {
    expect(parseCmsPostCreateBody({ slug: 'valid-slug', title: 'Title' })).toEqual({
      ok: true,
      value: { slug: 'valid-slug', title: 'Title', locale: 'ro' },
    });
    expect(parseCmsPostCreateBody({ slug: 'ab', title: 'Title' })).toEqual({
      ok: false,
      error: 'Slug invalid',
    });
  });

  it('parseCmsPostsLocale and delete id', () => {
    expect(parseCmsPostsLocale(new URLSearchParams('locale=ro'))).toBe('ro');
    expect(parseCmsPostDeleteId(new URLSearchParams('id=post-1'))).toBe('post-1');
  });

  it('exports stable e2e probe contract', () => {
    expect(ADMIN_CMS_POSTS_PROBE.path).toBe('/api/admin/cms/posts');
    expect(routeProbe.getMinRole).toBe('viewer');
    expect(routeProbe.writeMinRole).toBe('editor');
    expect(routeProbe.methods).toEqual(['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
  });
});

describe('/api/admin/cms/posts e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.role = 'editor';
    adminMocks.existingPost = adminMocks.posts[0] ?? null;
    adminMocks.deleted = false;
    adminMocks.updateCalls = 0;
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_CMS_POSTS_PATH);
    expect(src).toContain('api/admin/cms/posts/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminCmsPostsRoute(
      new Request(`http://test${ADMIN_CMS_POSTS_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('DELETE');
  });

  it('GET requires admin auth', async () => {
    adminMocks.authOk = false;
    const res = await adminCmsPostsRoute(adminRequest(`${ADMIN_CMS_POSTS_PATH}?locale=ro`, { method: 'GET' }));
    expect(res.status).toBe(ADMIN_CMS_POSTS_PROBE.unauthenticatedStatus);
  });

  it('GET returns post list', async () => {
    adminMocks.role = 'viewer';
    const res = await adminCmsPostsRoute(adminRequest(`${ADMIN_CMS_POSTS_PATH}?locale=ro`, { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { posts: Array<{ id: string; title: string }> };
    expect(body.posts[0]?.id).toBe('post-1');
    expect(body.posts[0]?.title).toBe('Ghid solar');
  });

  it('POST creates draft post and writes audit', async () => {
    const res = await adminCmsPostsRoute(
      adminRequest(ADMIN_CMS_POSTS_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: 'new-post', title: 'New Post', locale: 'ro' }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { post: { id: string; slug: string } };
    expect(body.post.id).toBe('post-new');
    expect(body.post.slug).toBe('new-post');
    expect(writeAdminAudit).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({ admin: expect.objectContaining({ id: 'admin_1' }) }),
      'CMS_POST_CREATED',
      'cms_post',
      'post-new',
      { slug: 'new-post', locale: 'ro' },
    );
  });

  it('PUT updates existing post', async () => {
    const res = await adminCmsPostsRoute(
      adminRequest(ADMIN_CMS_POSTS_PATH, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'post-1', title: 'Updated title', status: 'published' }),
      }),
    );
    expect(res.status).toBe(200);
    expect(adminMocks.updateCalls).toBe(1);
    expect(writeAdminAudit).toHaveBeenCalledWith(
      expect.any(Request),
      expect.any(Object),
      'CMS_POST_UPDATED',
      'cms_post',
      'post-1',
      { status: 'published' },
    );
  });

  it('DELETE removes post by id', async () => {
    const res = await adminCmsPostsRoute(
      adminRequest(`${ADMIN_CMS_POSTS_PATH}?id=post-1`, { method: 'DELETE' }),
    );
    expect(res.status).toBe(200);
    expect(adminMocks.deleted).toBe(true);
    expect(writeAdminAudit).toHaveBeenCalledWith(
      expect.any(Request),
      expect.any(Object),
      'CMS_POST_DELETED',
      'cms_post',
      'post-1',
      { slug: 'solar-guide' },
    );
  });

  it('PATCH returns 405', async () => {
    const res = await adminCmsPostsRoute(adminRequest(ADMIN_CMS_POSTS_PATH, { method: 'PATCH' }));
    expect(res.status).toBe(405);
  });
});