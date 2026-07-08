export const USER_MFA_STATUS_PATH = '/api/security/mfa';
export const USER_MFA_STATUS_METHODS = 'GET, OPTIONS';

export const USER_MFA_STATUS_PROBE = {
  path: USER_MFA_STATUS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
};

export type UserMfaRecord = {
  enabledAt?: Date | null;
  secretEncrypted?: string | null;
};

export function buildUserMfaStatus(mfa: UserMfaRecord | undefined) {
  const enabled = Boolean(mfa?.enabledAt);
  const pending = Boolean(!enabled && (mfa?.secretEncrypted ?? '').trim());
  return { ok: true as const, enabled, pending };
}