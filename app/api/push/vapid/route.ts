import { getAllowedOrigin } from '@/api/lib/cors';
import { corsJson, corsOptions } from '@/api/lib/http';
import { PUSH_VAPID_PROBE } from '@/api/lib/pushVapid';
import { getVapidPublicKey } from '@/api/lib/webPush';

export { PUSH_VAPID_PATH, PUSH_VAPID_PROBE } from '@/api/lib/pushVapid';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (req.method === 'OPTIONS') return corsOptions(req, PUSH_VAPID_PROBE.methods.join(', '));
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  try {
    return new Response(JSON.stringify({ ok: true, publicKey: getVapidPublicKey() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  } catch {
    return corsJson(req, PUSH_VAPID_PROBE.notConfiguredStatus, { error: PUSH_VAPID_PROBE.notConfiguredError });
  }
}