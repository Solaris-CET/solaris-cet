export const ACCOUNT_IDENTITIES_PATH = '/api/account/identities';
export const ACCOUNT_IDENTITIES_METHODS = 'GET, DELETE, OPTIONS';

export const ACCOUNT_IDENTITIES_PROBE = {
  path: ACCOUNT_IDENTITIES_PATH,
  methods: ['GET', 'DELETE', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  deleteTypes: ['telegram', 'oauth'] as const,
};

export type IdentityDeleteType = (typeof ACCOUNT_IDENTITIES_PROBE.deleteTypes)[number];

export type IdentityOAuthRow = {
  provider: string;
  providerUserId: string;
  username: string | null;
  linkedAt: string;
};

export type IdentityResponse = {
  ok: true;
  telegramLogin: { telegramUserId: string; username: string | null; linkedAt: string } | null;
  oauth: IdentityOAuthRow[];
};

export function parseDeleteIdentityBody(
  body: unknown,
): { type: IdentityDeleteType; provider: string } | { error: string } {
  const type =
    typeof body === 'object' && body !== null && 'type' in body && typeof (body as { type?: unknown }).type === 'string'
      ? (body as { type: string }).type.trim()
      : '';
  const provider =
    typeof body === 'object' && body !== null && 'provider' in body && typeof (body as { provider?: unknown }).provider === 'string'
      ? (body as { provider: string }).provider.trim().toLowerCase().slice(0, 24)
      : '';

  if (type === 'telegram') return { type: 'telegram', provider: '' };
  if (type === 'oauth') {
    if (!provider) return { error: 'Missing provider' };
    return { type: 'oauth', provider };
  }
  return { error: 'Invalid type' };
}

export function isIdentityDeleteType(value: string): value is IdentityDeleteType {
  return (ACCOUNT_IDENTITIES_PROBE.deleteTypes as readonly string[]).includes(value);
}