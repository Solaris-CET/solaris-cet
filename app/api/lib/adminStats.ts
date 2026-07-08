export const ADMIN_STATS_PATH = '/api/admin/stats';
export const ADMIN_STATS_METHODS = 'GET, OPTIONS';

export const ADMIN_STATS_PROBE = {
  path: ADMIN_STATS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  minRole: 'viewer' as const,
  unauthenticatedStatus: 401,
  window24hMs: 24 * 60 * 60 * 1000,
  window7dMs: 7 * 24 * 60 * 60 * 1000,
};

export function adminStatsSince24h(now = Date.now()): Date {
  return new Date(now - ADMIN_STATS_PROBE.window24hMs);
}

export function adminStatsSince7d(now = Date.now()): Date {
  return new Date(now - ADMIN_STATS_PROBE.window7dMs);
}

export function normalizeAdminAvgQualityScore(raw: unknown): number | null {
  return typeof raw === 'number' && Number.isFinite(raw) ? Number(raw) : null;
}