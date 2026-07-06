import { getDb, schema } from '../../../db/client';
import { requireAuth } from '../../lib/auth';
import { getAllowedOrigin } from '../../lib/cors';
import { sha256Hex } from '../../lib/nodeCrypto';
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
    keyPrefix: 'cet-ai-report',
    limit: 10,
    windowSeconds: 30,
  });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(allowedOrigin, { error: 'Invalid JSON body' }, 400);
  }

  const reason =
    typeof body === 'object' && body !== null && 'reason' in body && typeof (body as { reason: unknown }).reason === 'string'
      ? (body as { reason: string }).reason.trim().slice(0, 120)
      : '';
  const details =
    typeof body === 'object' && body !== null && 'details' in body && typeof (body as { details: unknown }).details === 'string'
      ? (body as { details: string }).details.trim().slice(0, 1200)
      : '';
  const messageId =
    typeof body === 'object' && body !== null && 'messageId' in body && typeof (body as { messageId: unknown }).messageId === 'string'
      ? (body as { messageId: string }).messageId.trim().slice(0, 80)
      : '';
  const query =
    typeof body === 'object' && body !== null && 'query' in body && typeof (body as { query: unknown }).query === 'string'
      ? (body as { query: string }).query.trim().slice(0, 500)
      : '';
  const response =
    typeof body === 'object' && body !== null && 'response' in body && typeof (body as { response: unknown }).response === 'string'
      ? (body as { response: string }).response.trim().slice(0, 2000)
      : '';

  if (!reason) return jsonResponse(allowedOrigin, { error: 'reason missing' }, 400);

  const auth = await requireAuth(req);
  const ctx = 'error' in auth ? null : auth;

  try {
    const db = getDb();
    const [r] = await db
      .insert(schema.aiReports)
      .values({
        userId: ctx?.user?.id ?? null,
        messageId: messageId || null,
        queryHash: query ? sha256Hex(query.toLowerCase()) : null,
        responseHash: response ? sha256Hex(response) : null,
        reason,
        details: details || null,
      })
      .returning({ id: schema.aiReports.id });
    return jsonResponse(allowedOrigin, { reportId: r?.id ?? null }, 201);
  } catch {
    return jsonResponse(allowedOrigin, { error: 'Unavailable' }, 503);
  }
}

