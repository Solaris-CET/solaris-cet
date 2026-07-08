export const PRICE_ALERTS_JOB_PATH = '/api/jobs/price-alerts';
export const PRICE_ALERTS_JOB_METHODS = 'POST, OPTIONS';

export const PRICE_ALERTS_JOB_ASSETS = ['CET', 'TON'] as const;
export type PriceAlertsJobAsset = (typeof PRICE_ALERTS_JOB_ASSETS)[number];

export const PRICE_ALERTS_JOB_PROBE = {
  path: PRICE_ALERTS_JOB_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  cronAuthRequired: true,
  alertsLimit: 500,
  assets: PRICE_ALERTS_JOB_ASSETS,
  emailTemplate: 'price_alert' as const,
  defaultCooldownMinutes: 1,
};