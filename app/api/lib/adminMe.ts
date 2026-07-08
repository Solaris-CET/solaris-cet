export const ADMIN_ME_PATH = '/api/admin/me';
export const ADMIN_ME_METHODS = 'GET, OPTIONS';

export const ADMIN_ME_PROBE = {
  path: ADMIN_ME_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
};