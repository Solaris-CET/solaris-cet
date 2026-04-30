import { gte, sql } from 'drizzle-orm';

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

  const db = getDb();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [u] = await db.select({ c: sql<number>`count(*)`.as('c') }).from(schema.users);
  const [q] = await db
    .select({ c: sql<number>`count(*)`.as('c') })
    .from(schema.aiQueryLogs)
    .where(gte(schema.aiQueryLogs.createdAt, since));
  const [c] = await db.select({ c: sql<number>`count(*)`.as('c') }).from(schema.aiConversations);
  const [p] = await db.select({ c: sql<number>`count(*)`.as('c') }).from(schema.cmsPosts);
  const [a] = await db
    .select({ c: sql<number>`count(*)`.as('c') })
    .from(schema.adminAuditLogs)
    .where(gte(schema.adminAuditLogs.createdAt, since));
  const [fb] = await db
    .select({
      total: sql<number>`count(*)`.as('total'),
      up: sql<number>`sum(case when ${schema.aiFeedback.rating} = 1 then 1 else 0 end)`.as('up'),
      down: sql<number>`sum(case when ${schema.aiFeedback.rating} = -1 then 1 else 0 end)`.as('down'),
    })
    .from(schema.aiFeedback)
    .where(gte(schema.aiFeedback.createdAt, since));
  const [avg] = await db
    .select({
      avgScore7d: sql<number>`avg(${schema.aiQueryLogs.qualityScore})`.as('avgScore7d'),
    })
    .from(schema.aiQueryLogs)
    .where(gte(schema.aiQueryLogs.createdAt, since7d));

  return corsJson(req, 200, {
    usersTotal: u?.c ?? 0,
    aiQueries24h: q?.c ?? 0,
    aiConversationsTotal: c?.c ?? 0,
    cmsPostsTotal: p?.c ?? 0,
    adminActions24h: a?.c ?? 0,
    aiFeedback24h: {
      total: fb?.total ?? 0,
      up: fb?.up ?? 0,
      down: fb?.down ?? 0,
    },
    aiAvgQualityScore7d:
      typeof avg?.avgScore7d === 'number' && Number.isFinite(avg.avgScore7d) ? Number(avg.avgScore7d) : null,
  });
}
