import { desc, eq } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { writeAdminAudit } from '../../lib/adminAudit';
import { requireAdminAuth, requireAdminRole } from '../../lib/adminAuth';
import { corsJson, corsOptions, readJson } from '../../lib/http';

export const config = { runtime: 'nodejs' };

function normalizeKey(key: string): string | null {
  const k = key.trim();
  if (!k) return null;
  if (k.length > 80) return null;
  if (!/^[a-z0-9_.-]+$/i.test(k)) return null;
  return k;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, PUT, OPTIONS');
  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const db = getDb();

  if (req.method === 'GET') {
    const ok = requireAdminRole(ctx, 'viewer');
    if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });
    const rows = await db.select().from(schema.cmsSettings).orderBy(desc(schema.cmsSettings.updatedAt)).limit(200);
    return corsJson(req, 200, { settings: rows });
  }

  if (req.method === 'PUT') {
    const ok = requireAdminRole(ctx, 'admin');
    if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });
    const body = await readJson(req).catch(() => null);
    const keyRaw =
      typeof body === 'object' && body !== null && typeof (body as { key?: unknown }).key === 'string'
        ? (body as { key: string }).key
        : '';
    const key = normalizeKey(keyRaw);
    const value = typeof body === 'object' && body !== null && 'value' in body ? (body as { value?: unknown }).value : null;
    if (!key) return corsJson(req, 400, { error: 'Key invalid' });
    if (value === null) return corsJson(req, 400, { error: 'Value missing' });
    const [existing] = await db.select().from(schema.cmsSettings).where(eq(schema.cmsSettings.key, key));
    if (existing) {
      await db
        .update(schema.cmsSettings)
        .set({ value: value as never, updatedAt: new Date(), updatedByAdminId: ctx.admin.id })
        .where(eq(schema.cmsSettings.key, key));
    } else {
      await db.insert(schema.cmsSettings).values({ key, value: value as never, updatedAt: new Date(), updatedByAdminId: ctx.admin.id });
    }
    await writeAdminAudit(req, ctx, 'SETTING_UPDATED', 'cms_setting', key, { key });
    const [row] = await db.select().from(schema.cmsSettings).where(eq(schema.cmsSettings.key, key));
    return corsJson(req, 200, { setting: row });
  }

  return corsJson(req, 405, { error: 'Method not allowed' });
}

