export const USER_MFA_ENABLE_PATH = '/api/security/mfa/enable';
export const USER_MFA_ENABLE_METHODS = 'POST, OPTIONS';

export const USER_MFA_ENABLE_PROBE = {
  path: USER_MFA_ENABLE_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  invalidCodeError: 'Invalid code' as const,
  setupRequiredStatus: 412,
  setupRequiredError: 'MFA setup required' as const,
  notConfiguredStatus: 501,
  notConfiguredError: 'Not configured' as const,
  invalidMfaStatus: 401,
  invalidMfaError: 'MFA invalid' as const,
  telegramMessage: '2FA activat pentru contul tău.' as const,
};