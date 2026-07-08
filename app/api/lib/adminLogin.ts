export const ADMIN_LOGIN_PATH = '/api/admin/login';
export const ADMIN_LOGIN_METHODS = 'POST, OPTIONS';

export const ADMIN_LOGIN_PROBE = {
  path: ADMIN_LOGIN_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  rateLimitKey: 'admin-login',
  jwtTtlSeconds: 60 * 60 * 8,
  minPasswordLength: 10,
  maxPasswordLength: 200,
  mfaCodePattern: /^\d{6}$/,
  auditAction: 'ADMIN_LOGIN' as const,
  bootstrapAuditAction: 'ADMIN_BOOTSTRAP' as const,
};

export function normalizeAdminLoginEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type AdminLoginBody = { email: string; password: string; mfaCode: string };

export function parseAdminLoginBody(body: unknown): AdminLoginBody {
  const emailRaw =
    typeof body === 'object' && body !== null && 'email' in body && typeof (body as { email?: unknown }).email === 'string'
      ? (body as { email: string }).email
      : '';
  const password =
    typeof body === 'object' && body !== null && 'password' in body && typeof (body as { password?: unknown }).password === 'string'
      ? (body as { password: string }).password
      : '';
  const mfaCode =
    typeof body === 'object' && body !== null && 'mfaCode' in body && typeof (body as { mfaCode?: unknown }).mfaCode === 'string'
      ? (body as { mfaCode: string }).mfaCode.trim()
      : '';
  return { email: normalizeAdminLoginEmail(emailRaw), password, mfaCode };
}

export function isAdminLoginPasswordValid(password: string): boolean {
  return password.length >= ADMIN_LOGIN_PROBE.minPasswordLength && password.length <= ADMIN_LOGIN_PROBE.maxPasswordLength;
}

export function isAdminLoginMfaCodeValid(code: string): boolean {
  return ADMIN_LOGIN_PROBE.mfaCodePattern.test(code);
}