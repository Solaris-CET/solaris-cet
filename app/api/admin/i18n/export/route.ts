import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { writeAdminAudit } from '@/api/lib/adminAudit';
import { guardAdminRoute } from '@/api/lib/adminAuth';
import {
  ADMIN_I18N_EXPORT_PROBE,
  parseI18nExportLocale,
  parseI18nExportNamespace,
  translationsToRecord,
} from '../../../lib/adminI18nExport';
import { corsJson, corsOptions } from '@/api/lib/http';

export { ADMIN_I18N_EXPORT_PATH, ADMIN_I18N_EXPORT_PROBE } from '@/api/lib/adminI18nExport';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });
  const ctx = await guardAdminRoute(req, { minRole: ADMIN_I18N_EXPORT_PROBE.minRole });
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  const searchParams = new URL(req.url).searchParams;
  const locale = parseI18nExportLocale(searchParams);
  const namespace = parseI18nExportNamespace(searchParams);
  const db = getDb();
  const rows = await db
    .select({ key: schema.cmsTranslations.key, value: schema.cmsTranslations.value })
    .from(schema.cmsTranslations)
    .where(and(eq(schema.cmsTranslations.locale, locale), eq(schema.cmsTranslations.namespace, namespace)))
    .limit(ADMIN_I18N_EXPORT_PROBE.maxRows);

  await writeAdminAudit(req, ctx, ADMIN_I18N_EXPORT_PROBE.auditAction, 'cms_translations', `${locale}:${namespace}`, {
    locale,
    namespace,
    count: rows.length,
  });
  return corsJson(req, 200, { locale, namespace, translations: translationsToRecord(rows) });
}