import { and, eq, inArray } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { writeAdminAudit } from '@/api/lib/adminAudit';
import { guardAdminRoute } from '@/api/lib/adminAuth';
import {
  ADMIN_CMS_BLOCKS_PROBE,
  parseCmsBlockUpdates,
  parseCmsBlocksKeys,
  parseCmsBlocksLocale,
} from '../../../lib/adminCmsBlocks';
import { corsJson, corsOptions, readJson } from '@/api/lib/http';

export { ADMIN_CMS_BLOCKS_PATH, ADMIN_CMS_BLOCKS_PROBE } from '@/api/lib/adminCmsBlocks';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, PUT, OPTIONS');
  const ctx = await guardAdminRoute(req, { minRole: (m) => (m === 'PUT' ? ADMIN_CMS_BLOCKS_PROBE.putMinRole : ADMIN_CMS_BLOCKS_PROBE.getMinRole) });
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const db = getDb();

  if (req.method === 'GET') {
    const searchParams = new URL(req.url).searchParams;
    const locale = parseCmsBlocksLocale(searchParams);
    const keys = parseCmsBlocksKeys(searchParams);
    const rows = await db
      .select()
      .from(schema.cmsBlocks)
      .where(and(eq(schema.cmsBlocks.locale, locale), keys.length ? inArray(schema.cmsBlocks.key, keys) : undefined))
      .limit(ADMIN_CMS_BLOCKS_PROBE.maxListRows);
    return corsJson(req, 200, {
      blocks: rows.map((r) => ({
        id: r.id,
        key: r.key,
        locale: r.locale,
        format: r.format,
        content: r.content,
        updatedAt: r.updatedAt,
      })),
    });
  }

  if (req.method === 'PUT') {
    const out = parseCmsBlockUpdates(await readJson(req).catch(() => null));
    if (out.length === 0) return corsJson(req, 400, { error: 'No valid updates' });

    for (const u of out) {
      const [existing] = await db
        .select()
        .from(schema.cmsBlocks)
        .where(and(eq(schema.cmsBlocks.key, u.key), eq(schema.cmsBlocks.locale, u.locale)));
      if (existing) {
        await db
          .update(schema.cmsBlocks)
          .set({ content: u.content, format: u.format, updatedAt: new Date(), updatedByAdminId: ctx.admin.id })
          .where(eq(schema.cmsBlocks.id, existing.id));
      } else {
        await db.insert(schema.cmsBlocks).values({
          key: u.key,
          locale: u.locale,
          format: u.format,
          content: u.content,
          updatedAt: new Date(),
          updatedByAdminId: ctx.admin.id,
        });
      }
    }

    await writeAdminAudit(req, ctx, ADMIN_CMS_BLOCKS_PROBE.auditAction, 'cms_blocks', null, { count: out.length });
    return corsJson(req, 200, { ok: true });
  }

  return corsJson(req, 405, { error: 'Method not allowed' });
}