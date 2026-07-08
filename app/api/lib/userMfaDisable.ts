export const USER_MFA_DISABLE_PATH = '/api/security/mfa/disable';
export const USER_MFA_DISABLE_METHODS = 'POST, OPTIONS';

export const USER_MFA_DISABLE_PROBE = {
  path: USER_MFA_DISABLE_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  invalidCodeError: 'Invalid code' as const,
  notEnabledStatus: 412,
  notEnabledError: 'MFA not enabled' as const,
  notConfiguredStatus: 501,
  notConfiguredError: 'Not configured' as const,
  invalidMfaStatus: 401,
  invalidMfaError: 'MFA invalid' as const,
  telegramMessage: '2FA dezactivat pentru contul tău.' as const,
};