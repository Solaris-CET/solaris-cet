import { getDb } from '../../db/client';
import { sql } from 'drizzle-orm';
import { getAllowedOrigin } from '../lib/cors';

export const config = { runtime: 'nodejs' };

const startTime = Date.now();

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

  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const version = process.env.BUILD_SHA || process.env.GIT_SHA || process.env.VITE_GIT_COMMIT_HASH || 'unknown';

  // Database check
  let dbStatus = 'error';
  let dbLatency = 0;
  try {
    const db = getDb();
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    dbLatency = Date.now() - dbStart;
    dbStatus = 'ok';
  } catch (err) {
    console.error('Health check DB error:', err);
    dbStatus = 'error';
  }

  // Redis check
  let redisStatus = 'error';
  let redisLatency = 0;
  try {
    const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
    if (redisUrl) {
      const redisStart = Date.now();
      // Try to ping Redis via Upstash REST API or direct Redis
      if (redisUrl.includes('upstash') || redisUrl.includes('rest')) {
        const token = process.env.UPSTASH_REDIS_REST_TOKEN;
        if (token) {
          const res = await fetch(`${redisUrl.replace(/\/+$/, '')}/ping`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(3000),
          });
          redisLatency = Date.now() - redisStart;
          redisStatus = res.ok ? 'ok' : 'error';
        } else {
          redisStatus = 'skipped';
        }
      } else {
        // Direct Redis connection not available in edge runtime, skip
        redisStatus = 'skipped';
      }
    } else {
      redisStatus = 'skipped';
    }
  } catch (err) {
    console.error('Health check Redis error:', err);
    redisStatus = 'error';
  }

  // DeepSeek check (optional)
  let deepseekStatus = 'skipped';
  try {
    const apiKey = process.env.DEEPSEEK_CHATBOT_API_KEY;
    if (apiKey) {
      const res = await fetch('https://api.deepseek.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(5000),
      });
      deepseekStatus = res.ok ? 'ok' : 'error';
    }
  } catch {
    deepseekStatus = 'error';
  }

  // Memory usage
  const memoryUsage = process.memoryUsage();
  const memory = {
    heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
    heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
    rssMb: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100,
  };

  // Overall status
  let overallStatus: 'ok' | 'degraded' | 'down';
  if (dbStatus === 'ok') {
    overallStatus = redisStatus === 'error' ? 'degraded' : 'ok';
  } else {
    overallStatus = 'down';
  }

  const httpStatus = overallStatus === 'down' ? 503 : 200;

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
