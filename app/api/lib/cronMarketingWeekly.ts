export const CRON_MARKETING_WEEKLY_PATH = '/api/cron/marketing-weekly';
export const CRON_MARKETING_WEEKLY_METHODS = 'POST, OPTIONS';

export const CRON_MARKETING_WEEKLY_PROBE = {
  path: CRON_MARKETING_WEEKLY_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  cronAuthRequired: true,
  lookbackDays: 7,
  cronSecretHeader: 'X-Cron-Secret' as const,
};

export function marketingWeeklySince(now = Date.now()): Date {
  return new Date(now - CRON_MARKETING_WEEKLY_PROBE.lookbackDays * 24 * 60 * 60 * 1000);
}

export type MarketingWeeklyStats = {
  ok: true;
  since: string;
  leads7d: number;
  newsletter7d: {
    total: number;
    active: number;
    pending: number;
    unsubscribed: number;
  };
  shares7d: number;
  referrals7d: number;
};

export function buildMarketingWeeklyTelegramMessage(payload: MarketingWeeklyStats): string {
  return (
    `Marketing weekly (7d)\n` +
    `Leads: ${payload.leads7d}\n` +
    `Newsletter: ${payload.newsletter7d.total} (active ${payload.newsletter7d.active}, pending ${payload.newsletter7d.pending})\n` +
    `Shares: ${payload.shares7d}\n` +
    `Referrals: ${payload.referrals7d}\n` +
    `Since: ${payload.since}`
  );
}