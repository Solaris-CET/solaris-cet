export const ADMIN_ANALYTICS_OVERVIEW_PATH = '/api/admin/analytics/overview';
export const ADMIN_ANALYTICS_OVERVIEW_METHODS = 'GET, OPTIONS';

export const ADMIN_ANALYTICS_OVERVIEW_PROBE = {
  path: ADMIN_ANALYTICS_OVERVIEW_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  minRole: 'viewer' as const,
  unauthenticatedStatus: 401,
  defaultWindowDays: 30,
  minWindowDays: 1,
  maxWindowDays: 90,
};

export type RetentionDay = 'D1' | 'D7' | 'D30';

export function clampInt(v: string | null, def: number, min: number, max: number): number {
  const n = Number.parseInt(String(v ?? ''), 10);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, n));
}

export function parseOverviewDaysParam(searchParams: URLSearchParams): number {
  return clampInt(
    searchParams.get('days'),
    ADMIN_ANALYTICS_OVERVIEW_PROBE.defaultWindowDays,
    ADMIN_ANALYTICS_OVERVIEW_PROBE.minWindowDays,
    ADMIN_ANALYTICS_OVERVIEW_PROBE.maxWindowDays,
  );
}

export function dateToDayUtc(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function addDaysUtc(day: string, add: number): string | null {
  const m = day.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number.parseInt(m[1]!, 10);
  const mo = Number.parseInt(m[2]!, 10) - 1;
  const da = Number.parseInt(m[3]!, 10);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(da)) return null;
  const d = new Date(Date.UTC(y, mo, da));
  d.setUTCDate(d.getUTCDate() + add);
  return dateToDayUtc(d);
}

export function sessionQueryPercentiles(sessionCounts: number[]): { avg: number; p50: number; p90: number } {
  const sorted = sessionCounts.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!sorted.length) return { avg: 0, p50: 0, p90: 0 };
  const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  const p50 = sorted[Math.floor((sorted.length - 1) * 0.5)] ?? 0;
  const p90 = sorted[Math.floor((sorted.length - 1) * 0.9)] ?? 0;
  return { avg, p50, p90 };
}

export function activationRate(activated: number, eligible: number): number {
  return eligible > 0 ? activated / eligible : 0;
}