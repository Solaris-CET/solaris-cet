import { getAllowedOrigin } from '../lib/cors';

export const config = { runtime: 'edge' };

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
        'Vary': 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, allowedOrigin, 405);
  }

  const hasAiKey = Boolean(
    (process.env.GROK_API_KEY?.trim() || process.env.GROK_API_KEY_ENC?.trim()) &&
      (process.env.GEMINI_API_KEY?.trim() || process.env.GEMINI_API_KEY_ENC?.trim()),
  );

  const hasTonRpc = Boolean(process.env.TONCENTER_RPC_URL?.trim() || process.env.TONCENTER_API_KEY?.trim());

  return jsonResponse(
    {
      ok: true,
      ai: hasAiKey ? 'configured' : 'missing_keys',
      ton: hasTonRpc ? 'configured' : 'not_configured',
      time: new Date().toISOString(),
    },
    allowedOrigin,
    200,
  );
}

