export const ADMIN_MFA_SETUP_PATH = '/api/admin/mfa/setup';
export const ADMIN_MFA_SETUP_METHODS = 'POST, OPTIONS';

export const ADMIN_MFA_SETUP_PROBE = {
  path: ADMIN_MFA_SETUP_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  minRole: 'admin' as const,
  unauthenticatedStatus: 401,
  totpIssuer: 'Solaris Admin',
  secretBytes: 20,
};