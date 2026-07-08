export const APP_ADMIN_USERS_ROLE_PATH = '/api/app-admin/users/role';
export const APP_ADMIN_USERS_ROLE_METHODS = 'POST, OPTIONS';

export const APP_ADMIN_ROLES = ['visitor', 'investor', 'admin'] as const;
export type AppAdminRole = (typeof APP_ADMIN_ROLES)[number];

export const APP_ADMIN_USERS_ROLE_PROBE = {
  path: APP_ADMIN_USERS_ROLE_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  adminMfaRequired: true,
  invalidPayloadError: 'Invalid payload' as const,
  cannotChangeOwnRoleError: 'Cannot change own role' as const,
  notFoundError: 'Not found' as const,
  auditAction: 'USER_ROLE_CHANGED' as const,
};

export type RoleChangeBodyParse =
  | { ok: true; userId: string; role: AppAdminRole }
  | { ok: false; error: typeof APP_ADMIN_USERS_ROLE_PROBE.invalidPayloadError };

export function parseAppAdminRole(raw: string): AppAdminRole | null {
  const role = raw.trim().toLowerCase();
  return (APP_ADMIN_ROLES as readonly string[]).includes(role) ? (role as AppAdminRole) : null;
}

export function parseRoleChangeBody(body: unknown): RoleChangeBodyParse {
  const userId =
    typeof body === 'object' && body !== null && 'userId' in body && typeof (body as { userId?: unknown }).userId === 'string'
      ? (body as { userId: string }).userId.trim()
      : '';
  const roleRaw =
    typeof body === 'object' && body !== null && 'role' in body && typeof (body as { role?: unknown }).role === 'string'
      ? (body as { role: string }).role
      : '';
  const role = parseAppAdminRole(roleRaw);
  if (!userId || !role) return { ok: false, error: APP_ADMIN_USERS_ROLE_PROBE.invalidPayloadError };
  return { ok: true, userId, role };
}