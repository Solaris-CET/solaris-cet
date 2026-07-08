import { normalizeReferralCode } from './apiAuth';

export const AUTH_VERIFY_PATH = '/api/auth/verify';
export const AUTH_VERIFY_METHODS = 'POST, OPTIONS';

export const AUTH_VERIFY_PROBE = {
  path: AUTH_VERIFY_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  rateLimitKey: 'auth-verify' as const,
  rateLimit: 20,
  rateWindowSeconds: 60,
  jwtTtlSeconds: 60 * 60,
  invalidWalletError: 'Adresă invalidă' as const,
  missingTonProofError: 'Missing ton_proof' as const,
  challengeExpiredError: 'Challenge expired' as const,
  maxInviteTokenLength: 200,
  maxSkewSeconds: 10 * 60,
};

export type AuthVerifyPostBody = {
  walletRaw: string;
  publicKey: unknown;
  tonProofRaw: unknown;
  referralCode: string | null;
  inviteToken: string;
};

export function parseAuthVerifyPostBody(body: unknown): AuthVerifyPostBody {
  const walletRaw =
    typeof body === 'object' &&
    body !== null &&
    'walletAddress' in body &&
    typeof (body as { walletAddress?: unknown }).walletAddress === 'string'
      ? ((body as { walletAddress: string }).walletAddress ?? '').trim()
      : '';

  const publicKey =
    typeof body === 'object' && body !== null && 'publicKey' in body ? (body as { publicKey?: unknown }).publicKey : null;

  const tonProofRaw =
    typeof body === 'object' && body !== null && 'tonProof' in body ? (body as { tonProof?: unknown }).tonProof : null;

  const referralCode =
    typeof body === 'object' && body !== null && 'referralCode' in body
      ? normalizeReferralCode((body as { referralCode?: unknown }).referralCode)
      : null;

  const inviteToken =
    typeof body === 'object' && body !== null && 'inviteToken' in body && typeof (body as { inviteToken?: unknown }).inviteToken === 'string'
      ? (body as { inviteToken: string }).inviteToken.trim().slice(0, AUTH_VERIFY_PROBE.maxInviteTokenLength)
      : '';

  return { walletRaw, publicKey, tonProofRaw, referralCode, inviteToken };
}