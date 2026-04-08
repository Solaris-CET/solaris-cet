import { getAllowedOrigin } from '../lib/cors';

export const config = { runtime: 'edge' };

type UpstashResponse<T> = { result: T };

function jsonResponse(body: unknown, allowedOrigin: string, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Vary': 'Origin',
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
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, allowedOrigin, 405);
  }

  const upstashUrl = (process.env.UPSTASH_REDIS_REST_URL ?? '').trim();
  const upstashToken = (process.env.UPSTASH_REDIS_REST_TOKEN ?? '').trim();
  const key = 'cet-state-json';

  if (upstashUrl && upstashToken) {
    try {
      const got = await fetch(`${upstashUrl}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${upstashToken}` },
        cache: 'no-store',
      });
      if (got.ok) {
        const payload = (await got.json()) as UpstashResponse<string | null>;
        const cachedText = payload?.result ?? null;
        if (cachedText) {
          return jsonResponse(JSON.parse(cachedText), allowedOrigin, 200);
        }
      }
    } catch {
      // ignore
    }
  }

  try {
    const res = await fetch('/api/state.json', { cache: 'no-store' });
    const json = await res.json();

    if (upstashUrl && upstashToken) {
      const setUrl = `${upstashUrl}/set/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(json))}`;
      void fetch(`${setUrl}?ex=60`, {
        headers: { Authorization: `Bearer ${upstashToken}` },
        cache: 'no-store',
      }).catch(() => {});
    }

    return jsonResponse(json, allowedOrigin, 200);
  } catch {
    return jsonResponse({ error: 'unavailable' }, allowedOrigin, 200);
  }
}
