export const ADMIN_SIGNUP_PATH = '/api/admin/signup';
export const ADMIN_SIGNUP_METHODS = 'POST, OPTIONS';

export const ADMIN_SIGNUP_PROBE = {
  path: ADMIN_SIGNUP_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  rateLimitKey: 'admin-signup',
  jwtTtlSeconds: 60 * 60 * 8,
  minTokenLength: 16,
  maxTokenLength: 300,
  minPasswordLength: 10,
  maxPasswordLength: 200,
  auditAction: 'ADMIN_SIGNUP' as const,
};

export function normalizeAdminSignupEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type AdminSignupBody = { token: string; email: string; password: string };

export function parseAdminSignupBody(body: unknown): AdminSignupBody {
  const token =
    typeof body === 'object' && body !== null && 'token' in body && typeof (body as { token?: unknown }).token === 'string'
      ? (body as { token: string }).token.trim()
      : '';
  const emailRaw =
    typeof body === 'object' && body !== null && 'email' in body && typeof (body as { email?: unknown }).email === 'string'
      ? (body as { email: string }).email
      : '';
  const password =
    typeof body === 'object' && body !== null && 'password' in body && typeof (body as { password?: unknown }).password === 'string'
      ? (body as { password: string }).password
      : '';
  return { token, email: normalizeAdminSignupEmail(emailRaw), password };
}

export function isAdminSignupTokenValid(token: string): boolean {
  return token.length >= ADMIN_SIGNUP_PROBE.minTokenLength && token.length <= ADMIN_SIGNUP_PROBE.maxTokenLength;
}

export function isAdminSignupPasswordValid(password: string): boolean {
  return password.length >= ADMIN_SIGNUP_PROBE.minPasswordLength && password.length <= ADMIN_SIGNUP_PROBE.maxPasswordLength;
}