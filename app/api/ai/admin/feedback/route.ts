import { desc, gte, sql } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireAdmin, requireAuth } from '@/api/lib/auth';
import {
  AI_ADMIN_FEEDBACK_PROBE,
  aiAdminFeedbackSince24h,
  aiAdminFeedbackSince7d,
  anonymizeAiAdminUserId,
  normalizeAvgQualityScore,
  parseAiAdminFeedbackLimit,
} from '../../../lib/aiAdminFeedback';
import { getAllowedOrigin } from '@/api/lib/cors';
import { sha256Hex } from '@/api/lib/nodeCrypto';

export { AI_ADMIN_FEEDBACK_PATH, AI_ADMIN_FEEDBACK_PROBE } from '@/api/lib/aiAdminFeedback';

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

  const auth = await requireAuth(req);
  if ('error' in auth) return jsonResponse(allowedOrigin, { error: auth.error }, auth.status);
  const admin = requireAdmin(auth);
  if (!admin.ok) return jsonResponse(allowedOrigin, { error: admin.error }, admin.status);

  if (!process.env.DATABASE_URL?.trim()) return jsonResponse(allowedOrigin, { error: 'Unavailable' }, 503);

  try {
    const searchParams = new URL(req.url).searchParams;
    const limit = parseAiAdminFeedbackLimit(searchParams);
    const since7d = aiAdminFeedbackSince7d();
    const since24h = aiAdminFeedbackSince24h();
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
      user: anonymizeAiAdminUserId(r.userId, sha256Hex),
      queryLogId: r.queryLogId,
      messageId: r.messageId,
      rating: r.rating,
      comment: (r.comment ?? '').slice(0, AI_ADMIN_FEEDBACK_PROBE.maxCommentLength) || null,
      createdAt: r.createdAt,
    }));

    return jsonResponse(allowedOrigin, {
      feedback: out,
      aggregates: {
        avgQualityScore7d: normalizeAvgQualityScore(avg?.avgScore7d),
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