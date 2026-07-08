export const AUTH_CHALLENGE_PATH = '/api/auth/challenge';
export const AUTH_CHALLENGE_METHODS = 'GET, OPTIONS';

export const AUTH_CHALLENGE_PROBE = {
  path: AUTH_CHALLENGE_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  rateLimitKey: 'auth-challenge' as const,
  rateLimit: 40,
  rateWindowSeconds: 60,
  challengeTtlMs: 5 * 60 * 1000,
};