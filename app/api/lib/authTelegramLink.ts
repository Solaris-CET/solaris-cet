export const AUTH_TELEGRAM_LINK_PATH = '/api/auth/telegram/link';
export const AUTH_TELEGRAM_LINK_METHODS = 'POST, OPTIONS';

export const AUTH_TELEGRAM_LINK_PROBE = {
  path: AUTH_TELEGRAM_LINK_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  notConfiguredStatus: 501,
  alreadyLinkedStatus: 409,
  invalidPayloadError: 'Invalid payload' as const,
  invalidJsonError: 'Invalid JSON body' as const,
};