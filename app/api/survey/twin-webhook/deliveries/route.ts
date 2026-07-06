import { getAllowedOrigin } from '../../../lib/cors';

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

export default async function handler(req: Request): Promise<Response> {
  const allowed = getAllowedOrigin(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowed,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, allowed, 405);
  }

  const url = new URL(req.url);
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit')) || 50));
  const direction = (url.searchParams.get('direction') || '').trim();
  const qs = new URLSearchParams({ limit: String(limit) });
  if (direction) qs.set('direction', direction);

  try {
    const res = await fetch(`${ENGINE.replace(/\/$/, '')}/twin-webhook/deliveries?${qs}`, {
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    if (!res.ok) {
      return json({ error: (data as { detail?: string }).detail || 'Deliveries unavailable' }, allowed, 502);
    }
    return json({ platform: 'solaris-cet', ...data }, allowed, 200);
  } catch {
    return json({ error: 'survey-engine unreachable' }, allowed, 503);
  }
}