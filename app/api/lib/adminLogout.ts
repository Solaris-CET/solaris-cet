export const ADMIN_LOGOUT_PATH = '/api/admin/logout';
export const ADMIN_LOGOUT_METHODS = 'POST, OPTIONS';

export const ADMIN_LOGOUT_PROBE = {
  path: ADMIN_LOGOUT_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  auditAction: 'ADMIN_LOGOUT' as const,
};