export const APP_ADMIN_USERS_PATH = '/api/app-admin/users';
export const APP_ADMIN_USERS_METHODS = 'GET, OPTIONS';

export const APP_ADMIN_USERS_PROBE = {
  path: APP_ADMIN_USERS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  adminMfaRequired: true,
  defaultLimit: 50,
  minLimit: 1,
  maxLimit: 200,
};

export function parseAppAdminUsersLimit(searchParams: URLSearchParams): number {
  const raw = searchParams.get('limit') ?? String(APP_ADMIN_USERS_PROBE.defaultLimit);
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return APP_ADMIN_USERS_PROBE.defaultLimit;
  return Math.max(APP_ADMIN_USERS_PROBE.minLimit, Math.min(APP_ADMIN_USERS_PROBE.maxLimit, n));
}