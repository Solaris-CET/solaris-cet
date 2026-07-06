import { getAllowedOrigin } from '../../lib/cors';

export const config = { runtime: 'nodejs' };

const ENGINE = process.env.SURVEY_ENGINE_URL || 'http://127.0.0.1:8000';

function json(body: unknown, origin: string, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
      'Cache-Control': 'no-store',
    },
  });
}

function twinSecretOk(req: Request): boolean {
  const expected = String(process.env.TWIN_WEBHOOK_SECRET ?? '').trim();
  if (!expected) return true;
  const got = String(req.headers.get('x-twin-webhook-secret') ?? '').trim();
  return got === expected;
}

export default async function handler(req: Request): Promise<Response> {
  const allowed = getAllowedOrigin(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowed,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Twin-Webhook-Secret',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, allowed, 405);
  }

  if (!twinSecretOk(req)) {
    return json({ error: 'Invalid twin webhook secret' }, allowed, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'JSON invalid' }, allowed, 400);
  }

  const reportId = String(body.report_id ?? body.reportId ?? '').trim();
  if (!reportId) {
    return json({ error: 'report_id required' }, allowed, 400);
  }

  const event = String(body.event ?? body.event_type ?? 'crm_sync').trim();
  const { report_id: _r, reportId: _r2, event: _e, event_type: _e2, ...rest } = body;

  try {
    const res = await fetch(`${ENGINE.replace(/\/$/, '')}/twin-webhook/inbound`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.TWIN_WEBHOOK_SECRET
          ? { 'X-Twin-Webhook-Secret': process.env.TWIN_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify({ report_id: reportId, event, payload: rest }),
      signal: AbortSignal.timeout(12_000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return json(
        { error: (data as { detail?: string }).detail || 'Inbound twin webhook failed' },
        allowed,
        res.status === 400 ? 400 : 502,
      );
    }
    return json({ platform: 'solaris-cet', ...data }, allowed, 200);
  } catch {
    return json({ error: 'survey-engine unreachable' }, allowed, 503);
  }
}