import { getAllowedOrigin } from '../../lib/cors';

export const config = { runtime: 'nodejs' };

const ENGINE = process.env.SURVEY_ENGINE_URL || 'http://127.0.0.1:8000';

function safeFilePath(raw: string): string | null {
  const name = raw.trim().replace(/\\/g, '/');
  if (!name || name.includes('..') || name.startsWith('/')) return null;
  if (!/^[A-Za-z0-9._/-]+$/.test(name)) return null;
  return name;
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
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowed, Vary: 'Origin' },
    });
  }

  const url = new URL(req.url);
  const file = safeFilePath(url.searchParams.get('file') || '');
  if (!file) {
    return new Response(JSON.stringify({ error: 'Invalid file parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowed, Vary: 'Origin' },
    });
  }

  try {
    const enginePath = file.split('/').map((seg) => encodeURIComponent(seg)).join('/');
    const res = await fetch(`${ENGINE.replace(/\/$/, '')}/files/${enginePath}`, {
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: res.status === 404 ? 404 : 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowed, Vary: 'Origin' },
      });
    }

    const buf = await res.arrayBuffer();
    const media = file.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/json';
    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': media,
        'Content-Disposition': `attachment; filename="${file}"`,
        'Access-Control-Allow-Origin': allowed,
        Vary: 'Origin',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'survey-engine unreachable', engine_url: ENGINE }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowed, Vary: 'Origin' },
    });
  }
}