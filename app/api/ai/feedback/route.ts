import { getDb, schema } from '@/db/client';
import { type AuthContext, requireAuth } from '@/api/lib/auth';
import { AI_FEEDBACK_PROBE, parseFeedbackBody } from '@/api/lib/aiFeedback';
import { getAllowedOrigin } from '@/api/lib/cors';
import { withUpstashRateLimit } from '@/api/lib/rateLimit';

export { AI_FEEDBACK_PATH, AI_FEEDBACK_PROBE } from '@/api/lib/aiFeedback';

export const config = { runtime: 'nodejs' };

function jsonResponse(allowedOrigin: string, body: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
      'Cache-Control': 'no-store',
      ...(extraHeaders ?? {}),
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-MFA-Code',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse(allowedOrigin, { error: 'Method not allowed' }, 405);
  }

  const limited = await withUpstashRateLimit(req, allowedOrigin, {
    keyPrefix: AI_FEEDBACK_PROBE.rateLimitKey,
    limit: AI_FEEDBACK_PROBE.rateLimit,
    windowSeconds: AI_FEEDBACK_PROBE.rateWindowSeconds,
  });
  if (limited) return limited;

  if (!process.env.DATABASE_URL?.trim()) {
    return jsonResponse(allowedOrigin, { error: 'Unavailable' }, 503);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(allowedOrigin, { error: 'Invalid JSON body' }, 400);
  }

  const parsed = parseFeedbackBody(body);
  if (!parsed) {
    return jsonResponse(allowedOrigin, { error: AI_FEEDBACK_PROBE.invalidRatingError }, 400);
  }
  const { rating, messageId, queryLogId, comment } = parsed;

  let ctx: AuthContext | null;
  try {
    const auth = await requireAuth(req);
    ctx = 'error' in auth ? null : auth;
  } catch {
    ctx = null;
  }

  try {
    const db = getDb();
    const [row] = await db
      .insert(schema.aiFeedback)
      .values({
        userId: ctx?.user?.id ?? null,
        queryLogId,
        messageId,
        rating,
        comment: comment || null,
      })
      .returning({ id: schema.aiFeedback.id, createdAt: schema.aiFeedback.createdAt });

    return jsonResponse(allowedOrigin, { ok: true, id: row?.id ?? null, createdAt: row?.createdAt ?? null }, 200);
  } catch {
    return jsonResponse(allowedOrigin, { error: 'Unavailable' }, 503);
  }
}