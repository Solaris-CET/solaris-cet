import { getDb, schema } from '../../../db/client';
import { type AuthContext,requireAuth } from '../../lib/auth';
import { getAllowedOrigin } from '../../lib/cors';
import { withUpstashRateLimit } from '../../lib/rateLimit';

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

function safeText(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function safeId(v: unknown): string | null {
  const s = safeText(v, 80);
  return s.length >= 10 ? s : null;
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
    keyPrefix: 'cet-ai-feedback',
    limit: 30,
    windowSeconds: 10,
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

  const ratingRaw =
    typeof body === 'object' && body !== null && 'rating' in body ? (body as { rating: unknown }).rating : null;
  const rating = typeof ratingRaw === 'number' ? Math.trunc(ratingRaw) : Number(ratingRaw);
  if (![1, 0, -1].includes(rating)) {
    return jsonResponse(allowedOrigin, { error: 'Invalid rating. Expected -1, 0, or 1.' }, 400);
  }

  const messageId =
    typeof body === 'object' && body !== null && 'messageId' in body ? safeId((body as { messageId: unknown }).messageId) : null;
  const queryLogId =
    typeof body === 'object' && body !== null && 'queryLogId' in body ? safeId((body as { queryLogId: unknown }).queryLogId) : null;
  const comment =
    typeof body === 'object' && body !== null && 'comment' in body ? safeText((body as { comment: unknown }).comment, 2000) : '';

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

