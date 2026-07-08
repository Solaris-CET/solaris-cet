export const ADMIN_CACHE_CLEAR_PATH = '/api/admin/cache/clear';
export const ADMIN_CACHE_CLEAR_METHODS = 'POST, OPTIONS';

export const ADMIN_CACHE_CLEAR_KEYS = ['cet-state-json', 'cet-ai:onchain:v1'] as const;

export const ADMIN_CACHE_CLEAR_PROBE = {
  path: ADMIN_CACHE_CLEAR_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  minRole: 'admin' as const,
  unauthenticatedStatus: 401,
  auditAction: 'CACHE_CLEARED' as const,
  cacheKeys: ADMIN_CACHE_CLEAR_KEYS,
};