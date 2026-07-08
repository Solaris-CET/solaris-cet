export const ADMIN_MFA_PATH = '/api/admin/mfa';
export const ADMIN_MFA_METHODS = 'GET, OPTIONS';

export const ADMIN_MFA_PROBE = {
  path: ADMIN_MFA_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
};

export function resolveMfaStatus(admin: { mfaEnabledAt: Date | null; mfaSecretEncrypted: string | null } | null | undefined): {
  enabled: boolean;
  pending: boolean;
} {
  const enabled = Boolean(admin?.mfaEnabledAt);
  const pending = Boolean(!enabled && admin?.mfaSecretEncrypted);
  return { enabled, pending };
}