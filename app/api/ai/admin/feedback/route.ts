import { desc, gte, sql } from 'drizzle-orm';

import { getDb, schema } from '../../../../db/client';
import { requireAdmin, requireAuth } from '../../../lib/auth';
import { getAllowedOrigin } from '../../../lib/cors';
import { sha256Hex } from '../../../lib/nodeCrypto';

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

function clampInt(v: string | null, min: number, max: number, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
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

  const auth = await requireAuth(req);
  if ('error' in auth) return jsonResponse(allowedOrigin, { error: auth.error }, auth.status);
  const admin = requireAdmin(auth);
  if (!admin.ok) return jsonResponse(allowedOrigin, { error: admin.error }, admin.status);

  if (!process.env.DATABASE_URL?.trim()) return jsonResponse(allowedOrigin, { error: 'Unavailable' }, 503);

  try {
    const url = new URL(req.url);
    const limit = clampInt(url.searchParams.get('limit'), 1, 500, 200);
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const db = getDb();

    const rows = await db
      .select({
        id: schema.aiFeedback.id,
        userId: schema.aiFeedback.userId,
        queryLogId: schema.aiFeedback.queryLogId,
        messageId: schema.aiFeedback.messageId,
        rating: schema.aiFeedback.rating,
        comment: schema.aiFeedback.comment,
        createdAt: schema.aiFeedback.createdAt,
      })
      .from(schema.aiFeedback)
      .orderBy(desc(schema.aiFeedback.createdAt))
      .limit(limit);

    const [avg] = await db
      .select({
        avgScore7d: sql<number>`avg(${schema.aiQueryLogs.qualityScore})`.as('avgScore7d'),
        scoredCount7d: sql<number>`count(${schema.aiQueryLogs.qualityScore})`.as('scoredCount7d'),
      })
      .from(schema.aiQueryLogs)
      .where(gte(schema.aiQueryLogs.createdAt, since7d));

    const [fb24] = await db
      .select({
        total24h: sql<number>`count(*)`.as('total24h'),
        up24h: sql<number>`sum(case when ${schema.aiFeedback.rating} = 1 then 1 else 0 end)`.as('up24h'),
        down24h: sql<number>`sum(case when ${schema.aiFeedback.rating} = -1 then 1 else 0 end)`.as('down24h'),
      })
      .from(schema.aiFeedback)
      .where(gte(schema.aiFeedback.createdAt, since24h));

    const out = rows.map((r) => ({
      id: r.id,
      user: r.userId ? sha256Hex(r.userId).slice(0, 10) : 'anon',
      queryLogId: r.queryLogId,
      messageId: r.messageId,
      rating: r.rating,
      comment: (r.comment ?? '').slice(0, 800) || null,
      createdAt: r.createdAt,
    }));

    return jsonResponse(allowedOrigin, {
      feedback: out,
      aggregates: {
        avgQualityScore7d: typeof avg?.avgScore7d === 'number' && Number.isFinite(avg.avgScore7d) ? Number(avg.avgScore7d) : null,
        scoredCount7d: avg?.scoredCount7d ?? 0,
        feedback24h: {
          total: fb24?.total24h ?? 0,
          up: fb24?.up24h ?? 0,
          down: fb24?.down24h ?? 0,
        },
      },
    });
  } catch {
    return jsonResponse(allowedOrigin, { error: 'Unavailable' }, 503);
  }
}

