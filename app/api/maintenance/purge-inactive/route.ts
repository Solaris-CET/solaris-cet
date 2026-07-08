import { eq, inArray, lt, notInArray, sql } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { corsJson, corsOptions, readJson } from '@/api/lib/http';
import { parseMaintenanceBearer, parsePurgeInactiveBody, PURGE_INACTIVE_PROBE } from '@/api/lib/purgeInactive';

export { PURGE_INACTIVE_PATH, PURGE_INACTIVE_PROBE } from '@/api/lib/purgeInactive';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, PURGE_INACTIVE_PROBE.methods.join(', '));
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const maintenanceToken = String(process.env[PURGE_INACTIVE_PROBE.maintenanceTokenEnv] ?? '').trim();
  if (!maintenanceToken) return corsJson(req, PURGE_INACTIVE_PROBE.notConfiguredStatus, { error: 'Not configured' });
  const token = parseMaintenanceBearer(req);
  if (!token || token !== maintenanceToken) return corsJson(req, 401, { error: 'Unauthorized' });

  const body: unknown = await readJson(req).catch(() => null);
  const { days, limit, dryRun } = parsePurgeInactiveBody(body);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const db = getDb();
  const rows = await db
    .select({
      userId: schema.users.id,
      lastSessionAt: sql<Date | null>`max(coalesce(${schema.sessions.lastUsedAt}, ${schema.sessions.createdAt}))`,
    })
    .from(schema.users)
    .leftJoin(schema.sessions, eq(schema.sessions.userId, schema.users.id))
    .where(notInArray(schema.users.role, [...PURGE_INACTIVE_PROBE.protectedRoles]))
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