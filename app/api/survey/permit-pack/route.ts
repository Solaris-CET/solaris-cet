import { getAllowedOrigin } from '../../lib/cors';

export const config = { runtime: 'nodejs' };

const ENGINE = process.env.SURVEY_ENGINE_URL || 'http://127.0.0.1:8000';

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
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowed, Vary: 'Origin' },
    });
  }

  const url = new URL(req.url);
  const reportId = (url.searchParams.get('report_id') || '').trim();
  if (!reportId || reportId.length > 80) {
    return new Response(JSON.stringify({ error: 'report_id required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowed, Vary: 'Origin' },
    });
  }

  try {
    const res = await fetch(
      `${ENGINE.replace(/\/$/, '')}/permit-pack/${encodeURIComponent(reportId)}`,
      { signal: AbortSignal.timeout(30_000) },
    );
    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: err || 'Permit pack unavailable' }), {
        status: res.status === 404 ? 404 : 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowed, Vary: 'Origin' },
      });
    }
    const buf = await res.arrayBuffer();
    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="PERMIT_${reportId}.zip"`,
        'Access-Control-Allow-Origin': allowed,
        Vary: 'Origin',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'survey-engine unreachable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowed, Vary: 'Origin' },
    });
  }
}