import { getAllowedOrigin } from '@/api/lib/cors';
import { computeLyapunovScore, LYAPUNOV_PROBE, parseLyapunovState } from '@/api/lib/lyapunov';

export { LYAPUNOV_PATH, LYAPUNOV_PROBE } from '@/api/lib/lyapunov';

export const config = { runtime: 'edge' };

function jsonResponse(body: unknown, allowedOrigin: string, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
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
        'Access-Control-Allow-Methods': LYAPUNOV_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, allowedOrigin, 405);
  }

  try {
    const body = await req.json();
    const state = parseLyapunovState(body);
    if (!state) {
      return jsonResponse({ error: LYAPUNOV_PROBE.invalidStateError }, allowedOrigin, 400);
    }

    const { stable, score } = computeLyapunovScore(state);
    return jsonResponse({ stable, score, model: LYAPUNOV_PROBE.model }, allowedOrigin, 200);
  } catch {
    return jsonResponse({ error: LYAPUNOV_PROBE.invalidJsonError }, allowedOrigin, 400);
  }
}