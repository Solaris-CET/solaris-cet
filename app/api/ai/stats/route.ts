import { and, eq, gte, sql } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { requireAuth } from '../../lib/auth';
import { getAllowedOrigin } from '../../lib/cors';
import { withUpstashRateLimit } from '../../lib/rateLimit';

export const config = { runtime: 'nodejs' };

function jsonResponse(allowedOrigin: string, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
      'Cache-Control': 'no-store',
    },
  });
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-MFA-Code',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return jsonResponse(allowedOrigin, { error: 'Method not allowed' }, 405);
  }

  const limited = await withUpstashRateLimit(req, allowedOrigin, {
    keyPrefix: 'cet-ai-stats',
    limit: 20,
    windowSeconds: 10,
  });
  if (limited) return limited;

  if (!process.env.DATABASE_URL?.trim()) {
    return jsonResponse(allowedOrigin, { error: 'Unavailable' }, 503);
  }

  const auth = await requireAuth(req);
  if ('error' in auth) return jsonResponse(allowedOrigin, { error: auth.error }, auth.status);

  try {
    const db = getDb();
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [q24h] = await db
      .select({ c: sql<number>`count(*)`.as('c') })
      .from(schema.aiQueryLogs)
      .where(and(eq(schema.aiQueryLogs.userId, auth.user.id), gte(schema.aiQueryLogs.createdAt, since24h)));

    const [q7d] = await db
      .select({ c: sql<number>`count(*)`.as('c') })
      .from(schema.aiQueryLogs)
      .where(and(eq(schema.aiQueryLogs.userId, auth.user.id), gte(schema.aiQueryLogs.createdAt, since7d)));

    const [avg] = await db
      .select({ avgScore7d: sql<number>`avg(${schema.aiQueryLogs.qualityScore})`.as('avgScore7d') })
      .from(schema.aiQueryLogs)
      .where(and(eq(schema.aiQueryLogs.userId, auth.user.id), gte(schema.aiQueryLogs.createdAt, since7d)));

    const [fb7d] = await db
      .select({
        total: sql<number>`count(*)`.as('total'),
        up: sql<number>`sum(case when ${schema.aiFeedback.rating} = 1 then 1 else 0 end)`.as('up'),
        down: sql<number>`sum(case when ${schema.aiFeedback.rating} = -1 then 1 else 0 end)`.as('down'),
      })
      .from(schema.aiFeedback)
      .where(and(eq(schema.aiFeedback.userId, auth.user.id), gte(schema.aiFeedback.createdAt, since7d)));

    return jsonResponse(allowedOrigin, {
      queries24h: q24h?.c ?? 0,
      queries7d: q7d?.c ?? 0,
      avgQualityScore7d:
        typeof avg?.avgScore7d === 'number' && Number.isFinite(avg.avgScore7d) ? Number(avg.avgScore7d) : null,
      feedback7d: { total: fb7d?.total ?? 0, up: fb7d?.up ?? 0, down: fb7d?.down ?? 0 },
    });
  } catch {
    return jsonResponse(allowedOrigin, { error: 'Unavailable' }, 503);
  }
}
