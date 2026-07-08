import { getAllowedOrigin } from '@/api/lib/cors';
import { corsOptions } from '@/api/lib/http';
import { createRealtimePresenceStream, REALTIME_PRESENCE_PROBE } from '@/api/lib/realtimePresence';

export { REALTIME_PRESENCE_PATH, REALTIME_PRESENCE_PROBE } from '@/api/lib/realtimePresence';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') return corsOptions(req, REALTIME_PRESENCE_PROBE.methods.join(', '));
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }

  const stream = createRealtimePresenceStream(req);

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': REALTIME_PRESENCE_PROBE.contentType,
      'Cache-Control': REALTIME_PRESENCE_PROBE.cacheControl,
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
    },
  });
}