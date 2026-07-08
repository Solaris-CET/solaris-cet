import { getAllowedOrigin } from '@/api/lib/cors';
import {
  buildSolarisPromMetricsBody,
  collectSolarisEnvSnapshot,
  SOLARIS_METRICS_PROBE,
} from '../lib/solarisMetrics';

export { SOLARIS_METRICS_PATH, SOLARIS_METRICS_PROBE } from '@/api/lib/solarisMetrics';

export const config = { runtime: 'edge' };

function response(text: string, allowedOrigin: string): Response {
  return new Response(text, {
    status: 200,
    headers: {
      'Content-Type': SOLARIS_METRICS_PROBE.contentType,
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
      'Cache-Control': SOLARIS_METRICS_PROBE.cacheControl,
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
        'Access-Control-Allow-Methods': SOLARIS_METRICS_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return new Response('method not allowed', { status: 405 });
  }

  const body = buildSolarisPromMetricsBody(collectSolarisEnvSnapshot());
  return response(body, allowedOrigin);
}