import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '../../../../db/client';
import { writeAdminAudit } from '../../../lib/adminAudit';
import { requireAdminAuth, requireAdminRole } from '../../../lib/adminAuth';
import { corsJson, corsOptions } from '../../../lib/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });
  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const ok = requireAdminRole(ctx, 'viewer');
  if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });
  const url = new URL(req.url);
  const locale = (url.searchParams.get('locale') ?? 'ro').slice(0, 5);
  const namespace = (url.searchParams.get('namespace') ?? 'common').slice(0, 40);
  const db = getDb();
  const rows = await db
    .select({ key: schema.cmsTranslations.key, value: schema.cmsTranslations.value })
    .from(schema.cmsTranslations)
    .where(and(eq(schema.cmsTranslations.locale, locale), eq(schema.cmsTranslations.namespace, namespace)))
    .limit(50_000);
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.value;
  await writeAdminAudit(req, ctx, 'I18N_EXPORTED', 'cms_translations', `${locale}:${namespace}`, { locale, namespace, count: rows.length });
  return corsJson(req, 200, { locale, namespace, translations: out });
}

