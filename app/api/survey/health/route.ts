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

export default async function handler(req: Request): Promise<Response> {
  const allowed = getAllowedOrigin(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowed,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, allowed, 405);
  }

  try {
    const res = await fetch(`${ENGINE.replace(/\/$/, '')}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return json({ platform: 'solaris-cet', engine: data, engine_url: ENGINE }, allowed, res.ok ? 200 : 502);
  } catch {
    return json({
      platform: 'solaris-cet',
      engine: { ok: false, error: 'survey-engine unreachable' },
      engine_url: ENGINE,
    }, allowed, 503);
  }
}