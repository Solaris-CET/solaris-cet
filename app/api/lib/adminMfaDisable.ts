export const ADMIN_MFA_DISABLE_PATH = '/api/admin/mfa/disable';
export const ADMIN_MFA_DISABLE_METHODS = 'POST, OPTIONS';

export const ADMIN_MFA_TOTP_CODE_PATTERN = /^\d{6}$/;

export const ADMIN_MFA_DISABLE_PROBE = {
  path: ADMIN_MFA_DISABLE_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  minRole: 'admin' as const,
  unauthenticatedStatus: 401,
  totpCodePattern: ADMIN_MFA_TOTP_CODE_PATTERN,
};

export function parseMfaTotpCode(body: unknown): string {
  return typeof body === 'object' && body !== null && 'code' in body && typeof (body as { code?: unknown }).code === 'string'
    ? (body as { code: string }).code.trim()
    : '';
}

export function isValidMfaTotpCode(code: string): boolean {
  return ADMIN_MFA_TOTP_CODE_PATTERN.test(code);
}