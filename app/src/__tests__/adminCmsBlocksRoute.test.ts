// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_CMS_BLOCKS_PATH,
  ADMIN_CMS_BLOCKS_PROBE,
  normalizeCmsBlockFormat,
  parseCmsBlockUpdates,
  parseCmsBlocksKeys,
  parseCmsBlocksLocale,
} from '../../api/lib/adminCmsBlocks';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'editor' as 'admin' | 'editor' | 'viewer',
  blocks: [
    {
      id: 'block-1',
      key: 'hero.title',
      locale: 'ro',
      format: 'plain',
      content: 'Solaris CET',
      updatedAt: new Date('2026-03-01T10:00:00Z'),
    },
  ],
  existingBlock: null as {
    id: string;
    key: string;
    locale: string;
    format: string;
    content: string;
  } | null,
  updateCalls: 0,
  insertCalls: 0,
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
import adminCmsBlocksRoute, { ADMIN_CMS_BLOCKS_PROBE as routeProbe } from '../../api/admin/cms/blocks/route';
import { writeAdminAudit } from '../../api/lib/adminAudit';

describe('adminCmsBlocks helpers', () => {
  it('parseCmsBlocksLocale defaults to ro', () => {
    expect(parseCmsBlocksLocale(new URLSearchParams())).toBe('ro');
    expect(parseCmsBlocksLocale(new URLSearchParams('locale=en'))).toBe('en');
  });

  it('parseCmsBlocksKeys splits comma list', () => {
    expect(parseCmsBlocksKeys(new URLSearchParams('keys=hero.title,footer.text'))).toEqual([
      'hero.title',
      'footer.text',
    ]);
  });

  it('normalizeCmsBlockFormat accepts markdown', () => {
    expect(normalizeCmsBlockFormat('markdown')).toBe('markdown');
    expect(normalizeCmsBlockFormat('html')).toBe('plain');
  });

  it('parseCmsBlockUpdates validates update rows', () => {
    expect(
      parseCmsBlockUpdates({
        updates: [{ key: 'hero.title', locale: 'ro', content: 'Solaris', format: 'plain' }],
      }),
    ).toEqual([{ key: 'hero.title', locale: 'ro', content: 'Solaris', format: 'plain' }]);
    expect(parseCmsBlockUpdates({ updates: [] })).toEqual([]);
  });

  it('exports stable e2e probe contract', () => {
    expect(ADMIN_CMS_BLOCKS_PROBE.path).toBe('/api/admin/cms/blocks');
    expect(routeProbe.getMinRole).toBe('viewer');
    expect(routeProbe.putMinRole).toBe('editor');
    expect(routeProbe.methods).toEqual(['GET', 'PUT', 'OPTIONS']);
  });
});

describe('/api/admin/cms/blocks e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.role = 'editor';
    adminMocks.existingBlock = null;
    adminMocks.updateCalls = 0;
    adminMocks.insertCalls = 0;
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_CMS_BLOCKS_PATH);
    expect(src).toContain('api/admin/cms/blocks/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminCmsBlocksRoute(
      new Request(`http://test${ADMIN_CMS_BLOCKS_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('PUT');
  });

  it('GET requires admin auth', async () => {
    adminMocks.authOk = false;
    const res = await adminCmsBlocksRoute(adminRequest(ADMIN_CMS_BLOCKS_PATH, { method: 'GET' }));
    expect(res.status).toBe(ADMIN_CMS_BLOCKS_PROBE.unauthenticatedStatus);
  });

  it('GET returns blocks for locale and keys', async () => {
    adminMocks.role = 'viewer';
    const res = await adminCmsBlocksRoute(
      adminRequest(`${ADMIN_CMS_BLOCKS_PATH}?locale=ro&keys=hero.title`, { method: 'GET' }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { blocks: Array<{ key: string; content: string }> };
    expect(body.blocks[0]?.key).toBe('hero.title');
    expect(body.blocks[0]?.content).toBe('Solaris CET');
  });

  it('PUT requires editor role', async () => {
    adminMocks.role = 'viewer';
    const res = await adminCmsBlocksRoute(
      adminRequest(ADMIN_CMS_BLOCKS_PATH, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: [{ key: 'hero.title', content: 'Updated' }] }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it('PUT inserts new block and writes audit', async () => {
    const res = await adminCmsBlocksRoute(
      adminRequest(ADMIN_CMS_BLOCKS_PATH, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: [{ key: 'hero.subtitle', locale: 'ro', content: 'Energie verde', format: 'markdown' }],
        }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    expect(adminMocks.insertCalls).toBe(1);
    expect(writeAdminAudit).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({ admin: expect.objectContaining({ id: 'admin_1' }) }),
      'CMS_BLOCKS_UPDATED',
      'cms_blocks',
      null,
      { count: 1 },
    );
  });

  it('PUT updates existing block', async () => {
    adminMocks.existingBlock = {
      id: 'block-1',
      key: 'hero.title',
      locale: 'ro',
      format: 'plain',
      content: 'Old',
    };
    const res = await adminCmsBlocksRoute(
      adminRequest(ADMIN_CMS_BLOCKS_PATH, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: [{ key: 'hero.title', locale: 'ro', content: 'New title', format: 'plain' }],
        }),
      }),
    );
    expect(res.status).toBe(200);
    expect(adminMocks.updateCalls).toBe(1);
    expect(adminMocks.insertCalls).toBe(0);
  });

  it('PUT returns 400 for empty updates', async () => {
    const res = await adminCmsBlocksRoute(
      adminRequest(ADMIN_CMS_BLOCKS_PATH, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: [] }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('POST returns 405', async () => {
    const res = await adminCmsBlocksRoute(adminRequest(ADMIN_CMS_BLOCKS_PATH, { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});