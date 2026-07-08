import { aggregatePublicApiUsage } from './publicApiMetrics';

export const PUBLIC_V2_STATS_PATH = '/api/v2/stats';
export const PUBLIC_V2_STATS_METHODS = 'GET, OPTIONS';

export const PUBLIC_V2_STATS_PROBE = {
  path: PUBLIC_V2_STATS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  apiVersion: 'v2' as const,
  pathPrefix: '/api/v2/' as const,
  rateLimitBucket: 'public-v2-stats' as const,
  rateLimit: 60,
  rateWindowSeconds: 60,
  windowMs: 24 * 60 * 60 * 1000,
};

export function buildPublicV2StatsBody(apiKeyId: string, now = Date.now()) {
  const sinceMs = now - PUBLIC_V2_STATS_PROBE.windowMs;
  const global = aggregatePublicApiUsage({ sinceMs, pathPrefix: PUBLIC_V2_STATS_PROBE.pathPrefix });
  const mine = aggregatePublicApiUsage({ sinceMs, apiKeyId, pathPrefix: PUBLIC_V2_STATS_PROBE.pathPrefix });
  return {
    version: PUBLIC_V2_STATS_PROBE.apiVersion,
    window: { since: new Date(sinceMs).toISOString(), until: new Date(now).toISOString() },
    usage: {
      global,
      byApiKey: [{ apiKeyId, ...mine }],
    },
  };
}