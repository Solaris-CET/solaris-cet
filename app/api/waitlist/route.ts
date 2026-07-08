import { getAllowedOrigin } from '@/api/lib/cors';
import { withRateLimit } from '@/api/lib/rateLimit';
import { isValidWaitlistEmail, parseWaitlistEmail, resolveWaitlistWebhookUrl, WAITLIST_PROBE } from '@/api/lib/waitlist';

export { WAITLIST_PATH, WAITLIST_PROBE } from '@/api/lib/waitlist';

export const config = { runtime: 'edge' };

function jsonResponse(body: unknown, allowedOrigin: string, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
      'Cache-Control': WAITLIST_PROBE.cacheControl,
    },
  });
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (origin && allowedOrigin !== origin) {
    return jsonResponse({ error: 'Forbidden' }, allowedOrigin, 403);
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': WAITLIST_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, allowedOrigin, 405);
  }

  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: WAITLIST_PROBE.rateLimitKey,
    limit: WAITLIST_PROBE.rateLimit,
    windowSeconds: WAITLIST_PROBE.rateWindowSeconds,
  });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, allowedOrigin, 400);
  }

  const email = parseWaitlistEmail(body);
  if (!isValidWaitlistEmail(email)) {
    return jsonResponse({ error: 'Invalid email' }, allowedOrigin, 400);
  }

  const webhook = resolveWaitlistWebhookUrl();
  if (!webhook) {
    return jsonResponse({ ok: false, error: WAITLIST_PROBE.notConfiguredMessage }, allowedOrigin, 503);
  }

  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      return jsonResponse({ ok: false, error: 'Upstream rejected' }, allowedOrigin, 502);
    }
  } catch {
    return jsonResponse({ ok: false, error: 'Upstream unavailable' }, allowedOrigin, 502);
  }

  return jsonResponse({ ok: true }, allowedOrigin, 200);
}