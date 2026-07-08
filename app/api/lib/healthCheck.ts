import { sql } from 'drizzle-orm';

import { getDb } from '@/db/client';

export const HEALTH_PATH = '/api/health';
export const HEALTH_METHODS = 'GET, OPTIONS';

export type HealthDependencyStatus = 'ok' | 'error' | 'skipped';

export const HEALTH_PROBE = {
  path: HEALTH_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  redisTimeoutMs: 3000,
  deepseekTimeoutMs: 5000,
  deepseekModelsUrl: 'https://api.deepseek.com/v1/models',
  versionEnvKeys: ['BUILD_SHA', 'GIT_SHA', 'VITE_GIT_COMMIT_HASH'] as const,
  defaultVersion: 'unknown' as const,
};

export function resolveHealthVersion(): string {
  for (const key of HEALTH_PROBE.versionEnvKeys) {
    const value = String(process.env[key] ?? '').trim();
    if (value) return value;
  }
  return HEALTH_PROBE.defaultVersion;
}

export async function checkHealthDatabase(): Promise<{ status: 'ok' | 'error'; latencyMs: number }> {
  try {
    const db = getDb();
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    return { status: 'ok', latencyMs: Date.now() - dbStart };
  } catch (err) {
    console.error('Health check DB error:', err);
    return { status: 'error', latencyMs: 0 };
  }
}

export async function checkHealthRedis(): Promise<{ status: HealthDependencyStatus; latencyMs: number }> {
  try {
    const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
    if (!redisUrl) return { status: 'skipped', latencyMs: 0 };

    if (!redisUrl.includes('upstash') && !redisUrl.includes('rest')) {
      return { status: 'skipped', latencyMs: 0 };
    }

    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!token) return { status: 'skipped', latencyMs: 0 };

    const redisStart = Date.now();
    const res = await fetch(`${redisUrl.replace(/\/+$/, '')}/ping`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(HEALTH_PROBE.redisTimeoutMs),
    });
    return { status: res.ok ? 'ok' : 'error', latencyMs: Date.now() - redisStart };
  } catch (err) {
    console.error('Health check Redis error:', err);
    return { status: 'error', latencyMs: 0 };
  }
}

export function computeOverallHealth(
  dbStatus: 'ok' | 'error',
  redisStatus: HealthDependencyStatus,
): 'ok' | 'degraded' | 'down' {
  if (dbStatus === 'ok') return redisStatus === 'error' ? 'degraded' : 'ok';
  return 'down';
}

export function healthHttpStatus(overall: 'ok' | 'degraded' | 'down'): number {
  return overall === 'down' ? 503 : 200;
}

export function formatHealthMemory(): { heapUsedMb: number; heapTotalMb: number; rssMb: number } {
  const memoryUsage = process.memoryUsage();
  return {
    heapUsedMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
    heapTotalMb: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
    rssMb: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
  };
}