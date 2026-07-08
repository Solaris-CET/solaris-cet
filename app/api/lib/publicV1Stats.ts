import { aggregatePublicApiUsage } from './publicApiMetrics';

export const PUBLIC_V1_STATS_PATH = '/api/v1/stats';
export const PUBLIC_V1_STATS_METHODS = 'GET, OPTIONS';

export const PUBLIC_V1_STATS_PROBE = {
  path: PUBLIC_V1_STATS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  apiVersion: 'v1' as const,
  pathPrefix: '/api/v1/' as const,
  rateLimitBucket: 'public-v1-stats' as const,
  rateLimit: 60,
  rateWindowSeconds: 60,
  windowMs: 24 * 60 * 60 * 1000,
};

export function buildPublicV1StatsBody(apiKeyId: string, now = Date.now()) {
  const sinceMs = now - PUBLIC_V1_STATS_PROBE.windowMs;
  const global = aggregatePublicApiUsage({ sinceMs, pathPrefix: PUBLIC_V1_STATS_PROBE.pathPrefix });
  const mine = aggregatePublicApiUsage({ sinceMs, apiKeyId, pathPrefix: PUBLIC_V1_STATS_PROBE.pathPrefix });
  return {
    version: PUBLIC_V1_STATS_PROBE.apiVersion,
    window: { since: new Date(sinceMs).toISOString(), until: new Date(now).toISOString() },
    global,
    apiKey: { id: apiKeyId, usage: mine },
  };
}