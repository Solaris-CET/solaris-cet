export const AI_STATS_PATH = '/api/ai/stats';
export const AI_STATS_METHODS = 'GET, OPTIONS';

export const AI_STATS_PROBE = {
  path: AI_STATS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  rateLimitKey: 'cet-ai-stats' as const,
  rateLimit: 20,
  rateWindowSeconds: 10,
  window24hMs: 24 * 60 * 60 * 1000,
  window7dMs: 7 * 24 * 60 * 60 * 1000,
};

export function aiStatsSince24h(now = Date.now()): Date {
  return new Date(now - AI_STATS_PROBE.window24hMs);
}

export function aiStatsSince7d(now = Date.now()): Date {
  return new Date(now - AI_STATS_PROBE.window7dMs);
}

export function normalizeAiStatsAvgScore(raw: unknown): number | null {
  return typeof raw === 'number' && Number.isFinite(raw) ? Number(raw) : null;
}