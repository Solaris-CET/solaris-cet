import { getAllowedOrigin } from '@/api/lib/cors';
import {
  checkHealthDatabase,
  checkHealthRedis,
  computeOverallHealth,
  formatHealthMemory,
  HEALTH_PROBE,
  type HealthDependencyStatus,
  healthHttpStatus,
  resolveHealthVersion,
} from '../lib/healthCheck';

export { HEALTH_PATH, HEALTH_PROBE } from '@/api/lib/healthCheck';

export const config = { runtime: 'nodejs' };

const startTime = Date.now();

function jsonResponse(body: unknown, allowedOrigin: string, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
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
        'Access-Control-Allow-Methods': HEALTH_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, allowedOrigin, 405);
  }

  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const version = resolveHealthVersion();

  const { status: dbStatus, latencyMs: dbLatency } = await checkHealthDatabase();
  const { status: redisStatus, latencyMs: redisLatency } = await checkHealthRedis();

  let deepseekStatus: HealthDependencyStatus = 'skipped';
  try {
    const apiKey = process.env.DEEPSEEK_CHATBOT_API_KEY;
    if (apiKey) {
      const res = await fetch(HEALTH_PROBE.deepseekModelsUrl, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(HEALTH_PROBE.deepseekTimeoutMs),
      });
      deepseekStatus = res.ok ? 'ok' : 'error';
    }
  } catch {
    deepseekStatus = 'error';
  }

  const memory = formatHealthMemory();
  const overallStatus = computeOverallHealth(dbStatus, redisStatus);
  const httpStatus = healthHttpStatus(overallStatus);

  return jsonResponse(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime,
      version,
      checks: {
        database: { status: dbStatus, latencyMs: dbLatency },
        redis: { status: redisStatus, latencyMs: redisLatency },
        deepseek: { status: deepseekStatus },
        memory,
      },
    },
    allowedOrigin,
    httpStatus,
  );
}