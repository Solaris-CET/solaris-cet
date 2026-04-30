import { getAllowedOrigin } from '../../lib/cors';
import { corsJson, corsOptions } from '../../lib/http';
import { getVapidPublicKey } from '../../lib/webPush';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  try {
    return new Response(JSON.stringify({ ok: true, publicKey: getVapidPublicKey() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  } catch {
    return corsJson(req, 500, { error: 'Push not configured' });
  }
}

