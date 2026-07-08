export const ADMIN_USERS_PATH = '/api/admin/users';
export const ADMIN_USERS_METHODS = 'GET, DELETE, OPTIONS';

export const ADMIN_USERS_PROBE = {
  path: ADMIN_USERS_PATH,
  methods: ['GET', 'DELETE', 'OPTIONS'] as const,
  authRequired: true,
  getMinRole: 'viewer' as const,
  deleteMinRole: 'admin' as const,
  unauthenticatedStatus: 401,
  maxListRows: 300,
  auditAction: 'USER_DELETED' as const,
  missingIdError: 'Missing id' as const,
  notFoundError: 'Not found' as const,
};

export function parseAdminUsersQuery(searchParams: URLSearchParams): string {
  return (searchParams.get('q') ?? '').trim();
}

export function parseAdminUserDeleteId(searchParams: URLSearchParams): string {
  return (searchParams.get('id') ?? '').trim();
}