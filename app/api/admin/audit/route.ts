import { and, desc, eq, gte } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import {
  auditSinceDate,
  parseAuditActionParam,
  parseAuditSinceHoursParam,
} from '../../lib/adminAuditLogs';
import { guardAdminRoute } from '@/api/lib/adminAuth';
import { corsJson, corsOptions } from '@/api/lib/http';

export { ADMIN_AUDIT_LOGS_PATH, ADMIN_AUDIT_LOGS_PROBE } from '@/api/lib/adminAuditLogs';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });
  const ctx = await guardAdminRoute(req, { minRole: 'viewer' });
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  const searchParams = new URL(req.url).searchParams;
  const action = parseAuditActionParam(searchParams);
  const sinceHours = parseAuditSinceHoursParam(searchParams);
  const since = auditSinceDate(sinceHours);

  const db = getDb();
  const where = and(
    action ? eq(schema.adminAuditLogs.action, action) : undefined,
    since ? gte(schema.adminAuditLogs.createdAt, since) : undefined,
  );
  const rows = await db
    .select()
    .from(schema.adminAuditLogs)
    .where(where)
    .orderBy(desc(schema.adminAuditLogs.createdAt))
    .limit(500);

  return corsJson(req, 200, {
    audit: rows.map((r) => ({
      id: r.id,
      actorAdminId: r.actorAdminId,
      action: r.action,
      targetType: r.targetType,
      targetId: r.targetId,
      meta: r.meta,
      ip: r.ip,
      userAgent: r.userAgent,
      createdAt: r.createdAt,
    })),
  });
}