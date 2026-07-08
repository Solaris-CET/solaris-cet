export const LOGOUT_PATH = '/api/logout';
export const LOGOUT_METHODS = 'POST, OPTIONS';

export const LOGOUT_PROBE = {
  path: LOGOUT_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
};