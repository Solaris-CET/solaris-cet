export const WALLETS_LINK_PATH = '/api/wallets/link';
export const WALLETS_LINK_METHODS = 'POST, OPTIONS';

export const WALLETS_LINK_PROBE = {
  path: WALLETS_LINK_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  rateLimitKey: 'wallet-link' as const,
  rateLimit: 10,
  rateWindowSeconds: 60,
  jwtTtlSeconds: 60 * 60,
  maxLabelLength: 60,
  maxSkewSeconds: 10 * 60,
  invalidAddressError: 'Adresă invalidă' as const,
  missingProofError: 'Missing ton_proof' as const,
  challengeExpiredError: 'Challenge expired' as const,
  invalidSignatureError: 'Invalid signature' as const,
  walletTakenError: 'Wallet already linked to another user' as const,
  jwtNotConfiguredError: 'JWT not configured' as const,
};

export function parseWalletsLinkBody(body: unknown): {
  walletRaw: string;
  publicKey: unknown;
  tonProofRaw: unknown;
  label: string | null;
  setPrimary: boolean;
} {
  const walletRaw =
    typeof body === 'object' && body !== null && 'walletAddress' in body && typeof (body as { walletAddress?: unknown }).walletAddress === 'string'
      ? ((body as { walletAddress: string }).walletAddress ?? '').trim()
      : '';
  const publicKey = typeof body === 'object' && body !== null && 'publicKey' in body ? (body as { publicKey?: unknown }).publicKey : null;
  const tonProofRaw = typeof body === 'object' && body !== null && 'tonProof' in body ? (body as { tonProof?: unknown }).tonProof : null;
  const label =
    typeof body === 'object' && body !== null && 'label' in body && typeof (body as { label?: unknown }).label === 'string'
      ? (body as { label: string }).label.trim().slice(0, WALLETS_LINK_PROBE.maxLabelLength)
      : null;
  const setPrimary =
    typeof body === 'object' && body !== null && 'setPrimary' in body ? Boolean((body as { setPrimary?: unknown }).setPrimary) : false;
  return { walletRaw, publicKey, tonProofRaw, label, setPrimary };
}

export function resolveWalletsLinkExpectedDomain(allowedOrigin: string): string {
  try {
    const u = new URL(allowedOrigin);
    return u.hostname;
  } catch {
    return '';
  }
}

export function buildWalletsLinkSuccessBody(walletAddress: string, token: string) {
  return { ok: true, wallet: walletAddress, token };
}

export function buildWalletsLinkTelegramMessage(walletAddress: string): string {
  return `Wallet adăugat: ${walletAddress.slice(0, 10)}…`;
}