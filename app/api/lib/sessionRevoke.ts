export const SESSION_REVOKE_PATH = '/api/security/sessions/revoke';
export const SESSION_REVOKE_METHODS = 'POST, OPTIONS';

export const SESSION_REVOKE_PROBE = {
  path: SESSION_REVOKE_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  allowHeaders: 'Content-Type, Authorization, X-MFA-Code' as const,
  invalidSessionIdError: 'Invalid sessionId' as const,
  notFoundStatus: 404,
  notFoundError: 'Not found' as const,
  telegramMessage: 'O sesiune a fost revocată din Security settings.' as const,
};

export function parseSessionRevokeId(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const sessionId = (body as { sessionId?: unknown }).sessionId;
  const value = typeof sessionId === 'string' ? sessionId.trim() : '';
  return value || null;
}