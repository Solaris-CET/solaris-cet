import { ADMIN_MFA_TOTP_CODE_PATTERN, isValidMfaTotpCode, parseMfaTotpCode } from './adminMfaDisable';

export const ADMIN_MFA_ENABLE_PATH = '/api/admin/mfa/enable';
export const ADMIN_MFA_ENABLE_METHODS = 'POST, OPTIONS';

export const ADMIN_MFA_ENABLE_PROBE = {
  path: ADMIN_MFA_ENABLE_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  minRole: 'admin' as const,
  unauthenticatedStatus: 401,
  totpCodePattern: ADMIN_MFA_TOTP_CODE_PATTERN,
};

export { ADMIN_MFA_TOTP_CODE_PATTERN, isValidMfaTotpCode, parseMfaTotpCode };