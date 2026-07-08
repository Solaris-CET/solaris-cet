import { getDb, schema } from '@/db/client';
import { requireAuth } from '@/api/lib/auth';
import { AI_REPORT_PROBE, parseReportBody } from '@/api/lib/aiReport';
import { getAllowedOrigin } from '@/api/lib/cors';
import { sha256Hex } from '@/api/lib/nodeCrypto';
import { withUpstashRateLimit } from '@/api/lib/rateLimit';

export { AI_REPORT_PATH, AI_REPORT_PROBE } from '@/api/lib/aiReport';

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
    keyPrefix: AI_REPORT_PROBE.rateLimitKey,
    limit: AI_REPORT_PROBE.rateLimit,
    windowSeconds: AI_REPORT_PROBE.rateWindowSeconds,
  });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(allowedOrigin, { error: 'Invalid JSON body' }, 400);
  }

  const parsed = parseReportBody(body);
  if (!parsed.ok) return jsonResponse(allowedOrigin, { error: parsed.error }, 400);
  const { reason, details, messageId, query, response } = parsed;

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