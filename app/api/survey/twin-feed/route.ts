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
      'Cache-Control': 'private, max-age=120',
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
  const reportId = (url.searchParams.get('report_id') || '').trim();
  if (!reportId || reportId.length > 80) {
    return json({ error: 'report_id required' }, allowed, 400);
  }

  try {
    const res = await fetch(
      `${ENGINE.replace(/\/$/, '')}/twin-feed/${encodeURIComponent(reportId)}`,
      { signal: AbortSignal.timeout(8000) },
    );
    const data = await res.json();
    if (!res.ok) {
      return json({ error: data.detail || 'Twin feed unavailable' }, allowed, res.status === 404 ? 404 : 502);
    }
    return json({ platform: 'solaris-cet', feed: data }, allowed, 200);
  } catch {
    return json({ error: 'survey-engine unreachable' }, allowed, 503);
  }
}