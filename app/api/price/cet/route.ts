import { CET_PRICE_PROBE, loadCetPriceSnapshot } from '@/api/lib/cetPrice';
import { getAllowedOrigin } from '@/api/lib/cors';
import { jsonResponse, optionsResponse } from '@/api/lib/http';

export { CET_PRICE_PATH, CET_PRICE_PROBE } from '@/api/lib/cetPrice';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req, CET_PRICE_PROBE.methods.join(', '), 'Content-Type');
  }
  if (req.method !== 'GET') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  }

  const allowedOrigin = getAllowedOrigin(req.headers.get('origin'));
  try {
    const snapshot = await loadCetPriceSnapshot();
    return jsonResponse(req, snapshot);
  } catch {
    return new Response(JSON.stringify({ error: CET_PRICE_PROBE.unavailableError }), {
      status: CET_PRICE_PROBE.unavailableStatus,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        Vary: 'Origin',
        'Cache-Control': 'no-store',
      },
    });
  }
}