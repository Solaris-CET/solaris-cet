export const USER_MFA_SETUP_PATH = '/api/security/mfa/setup';
export const USER_MFA_SETUP_METHODS = 'POST, OPTIONS';

export const USER_MFA_SETUP_PROBE = {
  path: USER_MFA_SETUP_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  totpIssuer: 'Solaris CET' as const,
  secretBytes: 20,
  notConfiguredStatus: 501,
  notConfiguredError: 'Not configured' as const,
};

export function buildUserMfaAccountName(user: { walletAddress: string | null; id: string }): string {
  return (user.walletAddress ?? user.id).trim();
}