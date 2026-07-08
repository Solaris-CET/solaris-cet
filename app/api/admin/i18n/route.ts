import { and, desc, eq, ilike } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { writeAdminAudit } from '@/api/lib/adminAudit';
import { guardAdminRoute } from '@/api/lib/adminAuth';
import {
  ADMIN_I18N_PROBE,
  parseI18nListLocale,
  parseI18nListNamespace,
  parseI18nListQuery,
  parseI18nPutBody,
} from '../../lib/adminI18n';
import { corsJson, corsOptions, readJson } from '@/api/lib/http';

export { ADMIN_I18N_PATH, ADMIN_I18N_PROBE } from '@/api/lib/adminI18n';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, PUT, OPTIONS');
  const ctx = await guardAdminRoute(req, { minRole: (m) => (m === 'PUT' ? ADMIN_I18N_PROBE.putMinRole : ADMIN_I18N_PROBE.getMinRole) });
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const db = getDb();

  if (req.method === 'GET') {
    const searchParams = new URL(req.url).searchParams;
    const locale = parseI18nListLocale(searchParams);
    const namespace = parseI18nListNamespace(searchParams);
    const q = parseI18nListQuery(searchParams);
    const rows = await db
      .select()
      .from(schema.cmsTranslations)
      .where(
        and(
          eq(schema.cmsTranslations.locale, locale),
          eq(schema.cmsTranslations.namespace, namespace),
          q ? ilike(schema.cmsTranslations.key, `%${q}%`) : undefined,
        ),
      )
      .orderBy(desc(schema.cmsTranslations.updatedAt))
      .limit(ADMIN_I18N_PROBE.maxListRows);
    return corsJson(req, 200, { translations: rows });
  }

  if (req.method === 'PUT') {
    const parsed = parseI18nPutBody(await readJson(req).catch(() => null));
    if (!parsed.ok) return corsJson(req, 400, { error: parsed.error });
    const { locale, namespace, key, value } = parsed;
    const [existing] = await db
      .select()
      .from(schema.cmsTranslations)
      .where(
        and(
          eq(schema.cmsTranslations.locale, locale),
          eq(schema.cmsTranslations.namespace, namespace),
          eq(schema.cmsTranslations.key, key),
        ),
      );
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
    await writeAdminAudit(req, ctx, ADMIN_I18N_PROBE.auditAction, 'cms_translation', `${locale}:${namespace}:${key}`, {
      locale,
      namespace,
      key,
    });
    return corsJson(req, 200, { ok: true });
  }

  return corsJson(req, 405, { error: 'Method not allowed' });
}