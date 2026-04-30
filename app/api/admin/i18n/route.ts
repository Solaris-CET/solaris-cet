import { and, desc, eq, ilike } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { writeAdminAudit } from '../../lib/adminAudit';
import { requireAdminAuth, requireAdminRole } from '../../lib/adminAuth';
import { corsJson, corsOptions, readJson } from '../../lib/http';

export const config = { runtime: 'nodejs' };

function normLocale(v: unknown): string {
  if (typeof v === 'string') return v.slice(0, 5).toLowerCase();
  return 'ro';
}

function normNamespace(v: unknown): string {
  if (typeof v === 'string') {
    const s = v.trim();
    return s ? s.slice(0, 40) : 'common';
  }
  return 'common';
}

function normKey(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s) return null;
  if (s.length > 120) return null;
  return s;
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
    const namespace = (url.searchParams.get('namespace') ?? 'common').slice(0, 40);
    const q = (url.searchParams.get('q') ?? '').trim();
    const rows = await db
      .select()
      .from(schema.cmsTranslations)
      .where(and(eq(schema.cmsTranslations.locale, locale), eq(schema.cmsTranslations.namespace, namespace), q ? ilike(schema.cmsTranslations.key, `%${q}%`) : undefined))
      .orderBy(desc(schema.cmsTranslations.updatedAt))
      .limit(500);
    return corsJson(req, 200, { translations: rows });
  }

  if (req.method === 'PUT') {
    const ok = requireAdminRole(ctx, 'editor');
    if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });
    const body = await readJson(req).catch(() => null);
    const locale = normLocale(typeof body === 'object' && body !== null ? (body as { locale?: unknown }).locale : null);
    const namespace = normNamespace(typeof body === 'object' && body !== null ? (body as { namespace?: unknown }).namespace : null);
    const key = normKey(typeof body === 'object' && body !== null ? (body as { key?: unknown }).key : null);
    const value =
      typeof body === 'object' && body !== null && typeof (body as { value?: unknown }).value === 'string'
        ? (body as { value: string }).value.slice(0, 10_000)
        : null;
    if (!key || value === null) return corsJson(req, 400, { error: 'Invalid payload' });
    const [existing] = await db
      .select()
      .from(schema.cmsTranslations)
      .where(and(eq(schema.cmsTranslations.locale, locale), eq(schema.cmsTranslations.namespace, namespace), eq(schema.cmsTranslations.key, key)));
    if (existing) {
      await db
        .update(schema.cmsTranslations)
        .set({ value, updatedAt: new Date(), updatedByAdminId: ctx.admin.id })
        .where(eq(schema.cmsTranslations.id, existing.id));
    } else {
      await db.insert(schema.cmsTranslations).values({
        locale,
        namespace,
        key,
        value,
        updatedAt: new Date(),
        updatedByAdminId: ctx.admin.id,
      });
    }
    await writeAdminAudit(req, ctx, 'I18N_UPDATED', 'cms_translation', `${locale}:${namespace}:${key}`, { locale, namespace, key });
    return corsJson(req, 200, { ok: true });
  }

  return corsJson(req, 405, { error: 'Method not allowed' });
}

