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

  const dbConfigured = Boolean(process.env.DATABASE_URL?.trim());
  const aiConfigured = Boolean(
    (process.env.GROK_API_KEY?.trim() || process.env.GROK_API_KEY_ENC?.trim()) &&
      (process.env.GEMINI_API_KEY?.trim() || process.env.GEMINI_API_KEY_ENC?.trim()),
  );
  const tonConfigured = Boolean(process.env.TONCENTER_RPC_URL?.trim() || process.env.TONCENTER_API_KEY?.trim());

  return jsonResponse(
    {
      status: 'ok',
      checks: {
        db: dbConfigured ? 'configured' : 'missing',
        ai: aiConfigured ? 'configured' : 'missing',
        ton: tonConfigured ? 'configured' : 'missing',
      },
      time: new Date().toISOString(),
    },
    allowedOrigin,
  );
}

