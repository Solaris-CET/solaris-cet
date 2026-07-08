export const LEADERBOARD_WEEKLY_PATH = '/api/gamification/leaderboard/weekly';
export const LEADERBOARD_WEEKLY_METHODS = 'GET, OPTIONS';

export const LEADERBOARD_WEEKLY_PROBE = {
  path: LEADERBOARD_WEEKLY_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  listLimit: 50,
  userLookupLimit: 60,
  weekDays: 7,
};

export function startOfWeekUtc(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay();
  const delta = (day + 6) % 7;
  x.setUTCDate(x.getUTCDate() - delta);
  return x;
}

export function dayKeyUtc(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}