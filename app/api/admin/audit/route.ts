import { and, desc, eq, gte } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { requireAdminAuth, requireAdminRole } from '../../lib/adminAuth';
import { corsJson, corsOptions } from '../../lib/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });
  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const ok = requireAdminRole(ctx, 'viewer');
  if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });

  const url = new URL(req.url);
  const action = (url.searchParams.get('action') ?? '').trim();
  const sinceHours = Math.max(0, Math.min(24 * 90, Number(url.searchParams.get('sinceHours') ?? '0') || 0));
  const since = sinceHours ? new Date(Date.now() - sinceHours * 60 * 60 * 1000) : null;

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

