export const AUTH_TELEGRAM_LOGIN_PATH = '/api/auth/telegram/login';
export const AUTH_TELEGRAM_LOGIN_METHODS = 'POST, OPTIONS';

export const AUTH_TELEGRAM_LOGIN_PROBE = {
  path: AUTH_TELEGRAM_LOGIN_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  notConfiguredStatus: 501,
  notLinkedStatus: 404,
  jwtTtlSeconds: 60 * 60,
  invalidPayloadError: 'Invalid payload' as const,
  invalidJsonError: 'Invalid JSON body' as const,
};