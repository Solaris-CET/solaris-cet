import { eq, inArray, lt, notInArray, sql } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { corsJson, corsOptions, readJson } from '../../lib/http';

export const config = { runtime: 'nodejs' };

function bearer(req: Request): string | null {
  const auth = req.headers.get('authorization') ?? req.headers.get('Authorization') ?? '';
  if (!auth.toLowerCase().startsWith('bearer ')) return null;
  const token = auth.slice('bearer '.length).trim();
  return token ? token : null;
}

function parseBody(raw: unknown): { days: number; limit: number; dryRun: boolean } {
  const rec = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const daysRaw = typeof rec.days === 'number' ? rec.days : Number.NaN;
  const limitRaw = typeof rec.limit === 'number' ? rec.limit : Number.NaN;
  const dryRun = Boolean(rec.dryRun);

  const daysEnv = Number.parseInt(String(process.env.GDPR_INACTIVITY_DAYS ?? '365'), 10);
  const days = Number.isFinite(daysRaw) ? Math.floor(daysRaw) : Number.isFinite(daysEnv) ? daysEnv : 365;
  const limit = Number.isFinite(limitRaw) ? Math.floor(limitRaw) : 200;

  return {
    days: Math.min(Math.max(days, 30), 3650),
    limit: Math.min(Math.max(limit, 1), 1000),
    dryRun,
  };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const maintenanceToken = String(process.env.MAINTENANCE_TOKEN ?? '').trim();
  if (!maintenanceToken) return corsJson(req, 501, { error: 'Not configured' });
  const token = bearer(req);
  if (!token || token !== maintenanceToken) return corsJson(req, 401, { error: 'Unauthorized' });

  const body: unknown = await readJson(req).catch(() => null);
  const { days, limit, dryRun } = parseBody(body);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const db = getDb();
  const rows = await db
    .select({
      userId: schema.users.id,
      lastSessionAt: sql<Date | null>`max(coalesce(${schema.sessions.lastUsedAt}, ${schema.sessions.createdAt}))`,
    })
    .from(schema.users)
    .leftJoin(schema.sessions, eq(schema.sessions.userId, schema.users.id))
    .where(notInArray(schema.users.role, ['admin', 'support']))
    .groupBy(schema.users.id, schema.users.createdAt)
    .having(
      lt(
        sql<Date>`greatest(${schema.users.createdAt}, coalesce(max(coalesce(${schema.sessions.lastUsedAt}, ${schema.sessions.createdAt})), ${schema.users.createdAt}))`,
        cutoff,
      ),
    )
    .limit(limit);

  const ids = rows.map((r) => r.userId);
  if (dryRun) {
    return corsJson(req, 200, { ok: true, dryRun: true, days, cutoff: cutoff.toISOString(), candidates: ids.length });
  }

  if (ids.length === 0) {
    return corsJson(req, 200, { ok: true, deleted: 0, days, cutoff: cutoff.toISOString() });
  }

  await db.delete(schema.users).where(inArray(schema.users.id, ids));
  return corsJson(req, 200, { ok: true, deleted: ids.length, days, cutoff: cutoff.toISOString() });
}
