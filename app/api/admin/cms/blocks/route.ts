import { and, eq, inArray } from 'drizzle-orm';

import { getDb, schema } from '../../../../db/client';
import { writeAdminAudit } from '../../../lib/adminAudit';
import { requireAdminAuth, requireAdminRole } from '../../../lib/adminAuth';
import { corsJson, corsOptions, readJson } from '../../../lib/http';

export const config = { runtime: 'nodejs' };

type BlockFormat = 'plain' | 'markdown';

function normalizeFormat(v: unknown): BlockFormat {
  return v === 'markdown' ? 'markdown' : 'plain';
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, PUT, OPTIONS');
  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const db = getDb();

  if (req.method === 'GET') {
    const ok = requireAdminRole(ctx, 'viewer');
    if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });
    const url = new URL(req.url);
    const locale = (url.searchParams.get('locale') ?? 'ro').slice(0, 5);
    const keys = (url.searchParams.get('keys') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    const rows = await db
      .select()
      .from(schema.cmsBlocks)
      .where(and(eq(schema.cmsBlocks.locale, locale), keys.length ? inArray(schema.cmsBlocks.key, keys) : undefined))
      .limit(200);
    return corsJson(req, 200, {
      blocks: rows.map((r) => ({ id: r.id, key: r.key, locale: r.locale, format: r.format, content: r.content, updatedAt: r.updatedAt })),
    });
  }

  if (req.method === 'PUT') {
    const ok = requireAdminRole(ctx, 'editor');
    if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });
    const body = await readJson(req).catch(() => null);
    const updates =
      typeof body === 'object' && body !== null && 'updates' in body && Array.isArray((body as { updates?: unknown }).updates)
        ? ((body as { updates: unknown[] }).updates as unknown[])
        : [];
    if (updates.length === 0 || updates.length > 50) return corsJson(req, 400, { error: 'Invalid updates' });

    const out: { key: string; locale: string; format: string; content: string }[] = [];
    for (const u of updates) {
      if (!u || typeof u !== 'object') continue;
      const key = 'key' in u && typeof (u as { key?: unknown }).key === 'string' ? (u as { key: string }).key.trim() : '';
      const locale =
        'locale' in u && typeof (u as { locale?: unknown }).locale === 'string'
          ? (u as { locale: string }).locale.slice(0, 5)
          : 'ro';
      const content =
        'content' in u && typeof (u as { content?: unknown }).content === 'string'
          ? (u as { content: string }).content
          : '';
      const format = normalizeFormat('format' in u ? (u as { format?: unknown }).format : 'plain');
      if (!key || key.length > 120) continue;
      out.push({ key, locale, format, content: content.slice(0, 50_000) });
    }
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

    await writeAdminAudit(req, ctx, 'CMS_BLOCKS_UPDATED', 'cms_blocks', null, { count: out.length });
    return corsJson(req, 200, { ok: true });
  }

  return corsJson(req, 405, { error: 'Method not allowed' });
}

