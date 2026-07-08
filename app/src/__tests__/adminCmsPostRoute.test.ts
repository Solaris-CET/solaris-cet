// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ADMIN_CMS_POST_PATH, ADMIN_CMS_POST_PROBE, parseCmsPostId } from '../../api/lib/adminCmsPost';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'viewer' as 'admin' | 'viewer',
  post: {
    id: 'post-1',
    slug: 'solar-guide',
    locale: 'ro',
    title: 'Ghid solar',
    status: 'draft',
    content: 'Content',
    createdAt: new Date('2026-03-01T10:00:00Z'),
    updatedAt: new Date('2026-03-01T11:00:00Z'),
  } as Record<string, unknown> | null,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
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
            where: async () => (adminMocks.post ? [adminMocks.post] : []),
          };
        },
      };
    },
  }),
  schema: {
    cmsPosts: { id: 'cmsPosts.id' },
  },
}));

import adminCmsPostRoute, { ADMIN_CMS_POST_PROBE as routeProbe } from '../../api/admin/cms/post/route';

describe('adminCmsPost helpers', () => {
  it('parseCmsPostId trims id query param', () => {
    expect(parseCmsPostId(new URLSearchParams('id=post-1'))).toBe('post-1');
    expect(parseCmsPostId(new URLSearchParams('id=  '))).toBe('');
  });

  it('exports stable e2e probe contract', () => {
    expect(ADMIN_CMS_POST_PROBE.path).toBe('/api/admin/cms/post');
    expect(routeProbe.minRole).toBe('viewer');
    expect(routeProbe.methods).toEqual(['GET', 'OPTIONS']);
  });
});

describe('/api/admin/cms/post e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.role = 'viewer';
    adminMocks.post = {
      id: 'post-1',
      slug: 'solar-guide',
      locale: 'ro',
      title: 'Ghid solar',
      status: 'draft',
      content: 'Content',
      createdAt: new Date('2026-03-01T10:00:00Z'),
      updatedAt: new Date('2026-03-01T11:00:00Z'),
    };
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_CMS_POST_PATH);
    expect(src).toContain('api/admin/cms/post/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminCmsPostRoute(
      new Request(`http://test${ADMIN_CMS_POST_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('GET requires admin auth', async () => {
    adminMocks.authOk = false;
    const res = await adminCmsPostRoute(adminRequest(`${ADMIN_CMS_POST_PATH}?id=post-1`, { method: 'GET' }));
    expect(res.status).toBe(ADMIN_CMS_POST_PROBE.unauthenticatedStatus);
  });

  it('GET returns 400 when id is missing', async () => {
    const res = await adminCmsPostRoute(adminRequest(ADMIN_CMS_POST_PATH, { method: 'GET' }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Missing id');
  });

  it('GET returns 404 when post is not found', async () => {
    adminMocks.post = null;
    const res = await adminCmsPostRoute(adminRequest(`${ADMIN_CMS_POST_PATH}?id=missing`, { method: 'GET' }));
    expect(res.status).toBe(404);
  });

  it('GET returns post by id', async () => {
    const res = await adminCmsPostRoute(adminRequest(`${ADMIN_CMS_POST_PATH}?id=post-1`, { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { post: { id: string; title: string } };
    expect(body.post.id).toBe('post-1');
    expect(body.post.title).toBe('Ghid solar');
  });

  it('POST returns 405', async () => {
    const res = await adminCmsPostRoute(adminRequest(`${ADMIN_CMS_POST_PATH}?id=post-1`, { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});