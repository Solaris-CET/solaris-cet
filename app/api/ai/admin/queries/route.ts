import { desc } from 'drizzle-orm';

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

  try {
    const db = getDb();
    const rows = await db
      .select({
        id: schema.aiQueryLogs.id,
        userId: schema.aiQueryLogs.userId,
        createdAt: schema.aiQueryLogs.createdAt,
        query: schema.aiQueryLogs.query,
        model: schema.aiQueryLogs.model,
        latencyMs: schema.aiQueryLogs.latencyMs,
        usedCache: schema.aiQueryLogs.usedCache,
        moderationFlagged: schema.aiQueryLogs.moderationFlagged,
        qualityScore: schema.aiQueryLogs.qualityScore,
      })
      .from(schema.aiQueryLogs)
      .orderBy(desc(schema.aiQueryLogs.createdAt))
      .limit(500);

    const out = rows.map((r) => ({
      id: r.id,
      user: r.userId ? sha256Hex(r.userId).slice(0, 10) : 'anon',
      createdAt: r.createdAt,
      query: r.query.slice(0, 400),
      model: r.model,
      latencyMs: r.latencyMs,
      usedCache: r.usedCache,
      moderationFlagged: r.moderationFlagged,
      qualityScore: r.qualityScore,
    }));

    return jsonResponse(allowedOrigin, { queries: out });
  } catch {
    return jsonResponse(allowedOrigin, { error: 'Unavailable' }, 503);
  }
}
