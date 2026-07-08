import { desc, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { writeAdminAudit } from '@/api/lib/adminAudit';
import { guardAdminRoute } from '@/api/lib/adminAuth';
import { ADMIN_SETTINGS_PROBE, parseSettingPutBody } from '@/api/lib/adminSettings';
import { corsJson, corsOptions, readJson } from '@/api/lib/http';

export { ADMIN_SETTINGS_PATH, ADMIN_SETTINGS_PROBE } from '@/api/lib/adminSettings';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, PUT, OPTIONS');
  const ctx = await guardAdminRoute(req, { minRole: (m) => (m === 'PUT' ? ADMIN_SETTINGS_PROBE.putMinRole : ADMIN_SETTINGS_PROBE.getMinRole) });
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const db = getDb();

  if (req.method === 'GET') {
    const rows = await db
      .select()
      .from(schema.cmsSettings)
      .orderBy(desc(schema.cmsSettings.updatedAt))
      .limit(ADMIN_SETTINGS_PROBE.maxListRows);
    return corsJson(req, 200, { settings: rows });
  }

  if (req.method === 'PUT') {
    const parsed = parseSettingPutBody(await readJson(req).catch(() => null));
    if (!parsed.ok) return corsJson(req, 400, { error: parsed.error });
    const { key, value } = parsed;
    const [existing] = await db.select().from(schema.cmsSettings).where(eq(schema.cmsSettings.key, key));
    if (existing) {
      await db
        .update(schema.cmsSettings)
        .set({ value: value as never, updatedAt: new Date(), updatedByAdminId: ctx.admin.id })
        .where(eq(schema.cmsSettings.key, key));
    } else {
      await db.insert(schema.cmsSettings).values({
        key,
        value: value as never,
        updatedAt: new Date(),
        updatedByAdminId: ctx.admin.id,
      });
    }
    await writeAdminAudit(req, ctx, ADMIN_SETTINGS_PROBE.auditAction, 'cms_setting', key, { key });
    const [row] = await db.select().from(schema.cmsSettings).where(eq(schema.cmsSettings.key, key));
    return corsJson(req, 200, { setting: row });
  }

  return corsJson(req, 405, { error: 'Method not allowed' });
}