import { and, desc, eq, ilike } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { writeAdminAudit } from '@/api/lib/adminAudit';
import { guardAdminRoute } from '@/api/lib/adminAuth';
import {
  ADMIN_CMS_POSTS_PROBE,
  parseCmsPostCreateBody,
  parseCmsPostDeleteId,
  parseCmsPostsLocale,
  parseCmsPostsQueryFilter,
  parseCmsPostsStatusFilter,
  parseCmsPostUpdateBody,
} from '../../../lib/adminCmsPosts';
import { corsJson, corsOptions, readJson } from '@/api/lib/http';

export { ADMIN_CMS_POSTS_PATH, ADMIN_CMS_POSTS_PROBE } from '@/api/lib/adminCmsPosts';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, POST, PUT, DELETE, OPTIONS');
  const ctx = await guardAdminRoute(req, { minRole: (m) => (m === 'GET' ? ADMIN_CMS_POSTS_PROBE.getMinRole : ADMIN_CMS_POSTS_PROBE.writeMinRole) });
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const db = getDb();

  if (req.method === 'GET') {
    const searchParams = new URL(req.url).searchParams;
    const locale = parseCmsPostsLocale(searchParams);
    const status = parseCmsPostsStatusFilter(searchParams);
    const q = parseCmsPostsQueryFilter(searchParams);
    const where = and(
      locale ? eq(schema.cmsPosts.locale, locale) : undefined,
      status ? eq(schema.cmsPosts.status, status) : undefined,
      q ? ilike(schema.cmsPosts.title, `%${q}%`) : undefined,
    );
    const rows = await db
      .select({
        id: schema.cmsPosts.id,
        slug: schema.cmsPosts.slug,
        title: schema.cmsPosts.title,
        excerpt: schema.cmsPosts.excerpt,
        locale: schema.cmsPosts.locale,
        status: schema.cmsPosts.status,
        updatedAt: schema.cmsPosts.updatedAt,
        publishedAt: schema.cmsPosts.publishedAt,
      })
      .from(schema.cmsPosts)
      .where(where)
      .orderBy(desc(schema.cmsPosts.updatedAt))
      .limit(ADMIN_CMS_POSTS_PROBE.maxListRows);
    return corsJson(req, 200, { posts: rows });
  }

  if (req.method === 'POST') {
    const parsed = parseCmsPostCreateBody(await readJson(req).catch(() => null));
    if (!parsed.ok) return corsJson(req, 400, { error: parsed.error });
    const { slug, title, locale } = parsed.value;
    const [created] = await db
      .insert(schema.cmsPosts)
      .values({
        slug,
        title,
        locale,
        status: 'draft',
        markdown: '',
        createdByAdminId: ctx.admin.id,
        updatedByAdminId: ctx.admin.id,
      })
      .returning();
    await writeAdminAudit(req, ctx, ADMIN_CMS_POSTS_PROBE.auditActions.created, 'cms_post', created.id, {
      slug,
      locale,
    });
    return corsJson(req, 200, { post: created });
  }

  if (req.method === 'PUT') {
    const body = await readJson(req).catch(() => null);
    const id =
      typeof body === 'object' && body !== null && typeof (body as { id?: unknown }).id === 'string'
        ? (body as { id: string }).id
        : '';
    if (!id) return corsJson(req, 400, { error: 'Missing id' });
    const [existing] = await db.select().from(schema.cmsPosts).where(eq(schema.cmsPosts.id, id));
    if (!existing) return corsJson(req, 404, { error: 'Not found' });
    const update = parseCmsPostUpdateBody(body, existing);
    if (!update) return corsJson(req, 400, { error: 'Missing id' });
    const publishedAt =
      update.status === 'published' && !existing.publishedAt ? new Date() : existing.publishedAt;
    await db
      .update(schema.cmsPosts)
      .set({
        title: update.title,
        excerpt: update.excerpt,
        markdown: update.markdown,
        status: update.status,
        publishedAt,
        updatedAt: new Date(),
        updatedByAdminId: ctx.admin.id,
      })
      .where(eq(schema.cmsPosts.id, id));
    await writeAdminAudit(req, ctx, ADMIN_CMS_POSTS_PROBE.auditActions.updated, 'cms_post', id, {
      status: update.status,
    });
    const [post] = await db.select().from(schema.cmsPosts).where(eq(schema.cmsPosts.id, id));
    return corsJson(req, 200, { post });
  }

  if (req.method === 'DELETE') {
    const id = parseCmsPostDeleteId(new URL(req.url).searchParams);
    if (!id) return corsJson(req, 400, { error: 'Missing id' });
    const [existing] = await db.select().from(schema.cmsPosts).where(eq(schema.cmsPosts.id, id));
    if (!existing) return corsJson(req, 404, { error: 'Not found' });
    await db.delete(schema.cmsPosts).where(eq(schema.cmsPosts.id, id));
    await writeAdminAudit(req, ctx, ADMIN_CMS_POSTS_PROBE.auditActions.deleted, 'cms_post', id, {
      slug: existing.slug,
    });
    return corsJson(req, 200, { ok: true });
  }

  return corsJson(req, 405, { error: 'Method not allowed' });
}