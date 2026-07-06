import { and, desc, eq, ilike } from 'drizzle-orm';

import { getDb, schema } from '../../../../db/client';
import { writeAdminAudit } from '../../../lib/adminAudit';
import { requireAdminAuth, requireAdminRole } from '../../../lib/adminAuth';
import { corsJson, corsOptions, readJson } from '../../../lib/http';

export const config = { runtime: 'nodejs' };

function normalizeSlug(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const s = input.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{2,80}$/.test(s)) return null;
  return s;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, POST, PUT, DELETE, OPTIONS');
  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const db = getDb();

  if (req.method === 'GET') {
    const ok = requireAdminRole(ctx, 'viewer');
    if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });
    const url = new URL(req.url);
    const locale = (url.searchParams.get('locale') ?? '').slice(0, 5);
    const status = (url.searchParams.get('status') ?? '').trim();
    const q = (url.searchParams.get('q') ?? '').trim();
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
      .limit(200);
    return corsJson(req, 200, { posts: rows });
  }

  if (req.method === 'POST') {
    const ok = requireAdminRole(ctx, 'editor');
    if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });
    const body = await readJson(req).catch(() => null);
    const slug = normalizeSlug(typeof body === 'object' && body !== null ? (body as { slug?: unknown }).slug : null);
    const title =
      typeof body === 'object' && body !== null && typeof (body as { title?: unknown }).title === 'string'
        ? (body as { title: string }).title.trim().slice(0, 180)
        : '';
    const locale =
      typeof body === 'object' && body !== null && typeof (body as { locale?: unknown }).locale === 'string'
        ? (body as { locale: string }).locale.slice(0, 5)
        : 'ro';
    if (!slug) return corsJson(req, 400, { error: 'Slug invalid' });
    if (!title) return corsJson(req, 400, { error: 'Titlu invalid' });
    const [created] = await db
      .insert(schema.cmsPosts)
      .values({ slug, title, locale, status: 'draft', markdown: '', createdByAdminId: ctx.admin.id, updatedByAdminId: ctx.admin.id })
      .returning();
    await writeAdminAudit(req, ctx, 'CMS_POST_CREATED', 'cms_post', created.id, { slug, locale });
    return corsJson(req, 200, { post: created });
  }

  if (req.method === 'PUT') {
    const ok = requireAdminRole(ctx, 'editor');
    if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });
    const body = await readJson(req).catch(() => null);
    const id =
      typeof body === 'object' && body !== null && typeof (body as { id?: unknown }).id === 'string'
        ? (body as { id: string }).id
        : '';
    if (!id) return corsJson(req, 400, { error: 'Missing id' });
    const [existing] = await db.select().from(schema.cmsPosts).where(eq(schema.cmsPosts.id, id));
    if (!existing) return corsJson(req, 404, { error: 'Not found' });
    const title =
      typeof body === 'object' && body !== null && typeof (body as { title?: unknown }).title === 'string'
        ? (body as { title: string }).title.trim().slice(0, 180)
        : existing.title;
    const excerpt =
      typeof body === 'object' && body !== null && typeof (body as { excerpt?: unknown }).excerpt === 'string'
        ? (body as { excerpt: string }).excerpt.slice(0, 500)
        : existing.excerpt;
    const markdown =
      typeof body === 'object' && body !== null && typeof (body as { markdown?: unknown }).markdown === 'string'
        ? (body as { markdown: string }).markdown.slice(0, 200_000)
        : existing.markdown;
    const status =
      typeof body === 'object' && body !== null && typeof (body as { status?: unknown }).status === 'string'
        ? (body as { status: string }).status
        : existing.status;
    const nextStatus = status === 'published' ? 'published' : status === 'archived' ? 'archived' : 'draft';
    const publishedAt = nextStatus === 'published' && !existing.publishedAt ? new Date() : existing.publishedAt;
    await db
      .update(schema.cmsPosts)
      .set({ title, excerpt, markdown, status: nextStatus, publishedAt, updatedAt: new Date(), updatedByAdminId: ctx.admin.id })
      .where(eq(schema.cmsPosts.id, id));
    await writeAdminAudit(req, ctx, 'CMS_POST_UPDATED', 'cms_post', id, { status: nextStatus });
    const [post] = await db.select().from(schema.cmsPosts).where(eq(schema.cmsPosts.id, id));
    return corsJson(req, 200, { post });
  }

  if (req.method === 'DELETE') {
    const ok = requireAdminRole(ctx, 'editor');
    if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });
    const url = new URL(req.url);
    const id = (url.searchParams.get('id') ?? '').trim();
    if (!id) return corsJson(req, 400, { error: 'Missing id' });
    const [existing] = await db.select().from(schema.cmsPosts).where(eq(schema.cmsPosts.id, id));
    if (!existing) return corsJson(req, 404, { error: 'Not found' });
    await db.delete(schema.cmsPosts).where(eq(schema.cmsPosts.id, id));
    await writeAdminAudit(req, ctx, 'CMS_POST_DELETED', 'cms_post', id, { slug: existing.slug });
    return corsJson(req, 200, { ok: true });
  }

  return corsJson(req, 405, { error: 'Method not allowed' });
}
