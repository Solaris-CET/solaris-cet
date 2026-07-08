import { getAllowedOrigin } from '@/api/lib/cors';
import { corsJson, corsOptions } from '@/api/lib/http';
import { buildTestimonialsPayload, TESTIMONIALS_PROBE } from '@/api/lib/testimonials';

export { TESTIMONIALS_PATH, TESTIMONIALS_PROBE } from '@/api/lib/testimonials';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return corsOptions(req, TESTIMONIALS_PROBE.methods.join(', '));
  }

  if (req.method === 'HEAD') {
    const origin = req.headers.get('origin');
    const allowedOrigin = getAllowedOrigin(origin);
    return new Response(null, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        Vary: 'Origin',
        'Cache-Control': TESTIMONIALS_PROBE.cacheControl,
      },
    });
  }

  if (req.method !== 'GET') {
    return corsJson(req, 405, { error: 'Method not allowed' });
  }

  return corsJson(req, 200, buildTestimonialsPayload());
}