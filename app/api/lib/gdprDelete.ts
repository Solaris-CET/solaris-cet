export const GDPR_DELETE_PATH = '/api/gdpr';
export const GDPR_DELETE_METHODS = 'DELETE, OPTIONS';

export const GDPR_DELETE_PROBE = {
  path: GDPR_DELETE_PATH,
  methods: ['DELETE', 'OPTIONS'] as const,
  authRequired: true,
  rateLimitKey: 'gdpr_delete',
  rateLimit: 5,
  rateLimitWindowSeconds: 3600,
  successField: 'success' as const,
  anonymizedQuery: '[deleted]' as const,
};