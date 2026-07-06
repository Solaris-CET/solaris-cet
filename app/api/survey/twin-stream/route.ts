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
  const persistent = ['1', 'true', 'yes'].includes((url.searchParams.get('persistent') || '').trim().toLowerCase());
  if (!reportId || reportId.length > 80) {
    return json({ error: 'report_id required' }, allowed, 400);
  }

  const engineQs = persistent ? '?persistent=true' : '';
  const fetchOpts: RequestInit = persistent
    ? {}
    : { signal: AbortSignal.timeout(30_000) };

  try {
    const res = await fetch(
      `${ENGINE.replace(/\/$/, '')}/twin-stream/${encodeURIComponent(reportId)}${engineQs}`,
      fetchOpts,
    );
    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => ({}));
      return json({ error: (data as { detail?: string }).detail || 'Twin stream unavailable' }, allowed, res.status === 404 ? 404 : 502);
    }
    return new Response(res.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': allowed,
        Vary: 'Origin',
      },
    });
  } catch {
    return json({ error: 'survey-engine unreachable' }, allowed, 503);
  }
}