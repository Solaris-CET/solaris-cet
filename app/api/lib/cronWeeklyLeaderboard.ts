export const CRON_WEEKLY_LEADERBOARD_PATH = '/api/cron/weekly-leaderboard';
export const CRON_WEEKLY_LEADERBOARD_METHODS = 'POST, OPTIONS';

export const CRON_WEEKLY_LEADERBOARD_PROBE = {
  path: CRON_WEEKLY_LEADERBOARD_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  cronAuthRequired: true,
  topUsersLimit: 50,
  rewardsCount: 10,
  top10BadgeSlug: 'top10-weekly' as const,
  telegramNotifyEnv: 'TELEGRAM_NOTIFY_WEEKLY' as const,
  weeklyCetRewards: [50, 30, 20, 10, 8, 6, 5, 4, 3, 2] as const,
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

export function weeklyLeaderboardRange(now = new Date()): { start: Date; end: Date; weekStart: string; weekEnd: string } {
  const thisWeek = startOfWeekUtc(now);
  const start = new Date(thisWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
  const end = thisWeek;
  return {
    start,
    end,
    weekStart: dayKeyUtc(start),
    weekEnd: dayKeyUtc(new Date(end.getTime() - 24 * 60 * 60 * 1000)),
  };
}

export function weeklyCetRewardForRank(rankIndex: number): number {
  return CRON_WEEKLY_LEADERBOARD_PROBE.weeklyCetRewards[rankIndex] ?? 0;
}