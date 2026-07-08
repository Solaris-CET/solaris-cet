import { parseTonNetwork, type TonNetwork } from './tonapi';

export const AIRDROP_PROOF_PATH = '/api/airdrop/proof';
export const AIRDROP_PROOF_METHODS = 'GET, OPTIONS';

export const AIRDROP_PROOF_PROBE = {
  path: AIRDROP_PROOF_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  rateLimitKey: 'airdrop-proof' as const,
  rateLimit: 60,
  rateWindowSeconds: 60,
  invalidAddressError: 'Invalid address' as const,
  notConfiguredError: 'not_configured' as const,
};

export type StoredAirdropProof = { amountNanoCET: string; proof: string[]; index: number };

export function parseAirdropProofWallet(searchParams: URLSearchParams): string {
  return (searchParams.get('wallet') ?? '').trim();
}

export function parseAirdropProofNetwork(searchParams: URLSearchParams): TonNetwork {
  return parseTonNetwork(searchParams.get('network'));
}

export function parseAirdropProofsEnv(raw = process.env.AIRDROP_PROOFS_JSON): Record<string, StoredAirdropProof> | null {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return null;
  try {
    const json = JSON.parse(trimmed) as unknown;
    if (!json || typeof json !== 'object') return null;
    return json as Record<string, StoredAirdropProof>;
  } catch {
    return null;
  }
}