export const GDPR_EXPORT_PATH = '/api/gdpr/export';
export const GDPR_EXPORT_METHODS = 'GET, OPTIONS';

export const GDPR_EXPORT_PROBE = {
  path: GDPR_EXPORT_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  notFoundError: 'User not found' as const,
  rateLimitKey: 'gdpr_export',
  rateLimit: 10,
  rateLimitWindowSeconds: 3600,
  consentProofsLimit: 2000,
  contactsLimit: 50,
  pointsLedgerLimit: 5000,
  referralsAsReferrerLimit: 5000,
  referralsAsReferredLimit: 1,
  filenamePrefix: 'solaris-cet-data-export' as const,
};

export function isoDateString(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

export function buildGdprExportFilename(date: Date): string {
  return `${GDPR_EXPORT_PROBE.filenamePrefix}-${date.toISOString().slice(0, 10)}.json`;
}