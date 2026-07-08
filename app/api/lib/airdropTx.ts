import { parseTonNetwork, type TonNetwork } from './tonapi';

export const AIRDROP_TX_PATH = '/api/airdrop/tx';
export const AIRDROP_TX_METHODS = 'POST, OPTIONS';

export const AIRDROP_TX_PROBE = {
  path: AIRDROP_TX_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  rateLimitKey: 'airdrop-tx' as const,
  rateLimit: 30,
  rateWindowSeconds: 60,
  invalidAddressError: 'Invalid address' as const,
  notConfiguredError: 'not_configured' as const,
};

export type AirdropTxBodyParse = { wallet: string; network: TonNetwork };

export function parseAirdropTxBody(body: unknown): AirdropTxBodyParse {
  const wallet =
    typeof body === 'object' && body !== null && 'wallet' in body && typeof (body as { wallet?: unknown }).wallet === 'string'
      ? ((body as { wallet: string }).wallet ?? '').trim()
      : '';
  const network =
    typeof body === 'object' && body !== null && 'network' in body && typeof (body as { network?: unknown }).network === 'string'
      ? parseTonNetwork((body as { network: string }).network)
      : 'mainnet';
  return { wallet, network };
}