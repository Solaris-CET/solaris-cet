export const API_AUTH_PATH = '/api/auth';
export const API_AUTH_METHODS = 'GET, POST, DELETE, OPTIONS';

export const API_AUTH_PROBE = {
  path: API_AUTH_PATH,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'] as const,
  jwtTtlSeconds: 60 * 60,
  readRateLimitKey: 'auth-read' as const,
  readRateLimit: 120,
  deleteRateLimit: 10,
  writeRateLimitKey: 'auth-write' as const,
  writeRateLimit: 5,
  rateWindowSeconds: 60,
  invalidWalletError: 'Adresă invalidă' as const,
  referralCollisionError: 'Nu s-a putut genera un cod de referral unic' as const,
  maxInviteTokenLength: 200,
};

export function normalizeReferralCode(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const code = input.trim().toUpperCase();
  if (!code) return null;
  if (!/^[A-Z0-9_-]{4,20}$/.test(code)) return null;
  return code;
}

export type WalletAuthBodyParse =
  | { ok: true; walletRaw: string; referralCode: string | null; inviteToken: string }
  | { ok: false; error: typeof API_AUTH_PROBE.invalidWalletError };

export function parseWalletAuthPostBody(body: unknown): WalletAuthBodyParse {
  const rawWallet =
    typeof body === 'object' &&
    body !== null &&
    'walletAddress' in body &&
    typeof (body as { walletAddress: unknown }).walletAddress === 'string'
      ? (body as { walletAddress: string }).walletAddress
      : '';
  if (!rawWallet.trim()) return { ok: false, error: API_AUTH_PROBE.invalidWalletError };
  const referralCode =
    typeof body === 'object' && body !== null && 'referralCode' in body
      ? normalizeReferralCode((body as { referralCode?: unknown }).referralCode)
      : null;
  const inviteToken =
    typeof body === 'object' && body !== null && 'inviteToken' in body && typeof (body as { inviteToken?: unknown }).inviteToken === 'string'
      ? (body as { inviteToken: string }).inviteToken.trim().slice(0, API_AUTH_PROBE.maxInviteTokenLength)
      : '';
  return { ok: true, walletRaw: rawWallet, referralCode, inviteToken };
}