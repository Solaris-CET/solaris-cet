export const SESSION_REVOKE_ALL_PATH = '/api/security/sessions/revoke-all';
export const SESSION_REVOKE_ALL_METHODS = 'POST, OPTIONS';

export const SESSION_REVOKE_ALL_PROBE = {
  path: SESSION_REVOKE_ALL_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  allowHeaders: 'Content-Type, Authorization, X-MFA-Code' as const,
  missingSessionIdError: 'Session id missing' as const,
};

export function buildRevokeAllTelegramMessage(revokedCount: number): string {
  return `Au fost revocate ${revokedCount} sesiuni.`;
}