export const WALLET_RECOVERY_PATH = '/api/recovery';
export const WALLET_RECOVERY_METHODS = 'POST, OPTIONS';

export const WALLET_RECOVERY_PROBE = {
  path: WALLET_RECOVERY_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  invalidJsonError: 'Invalid JSON body' as const,
  missingWalletMessage: 'Provide a TON wallet address to continue.' as const,
  walletReceivedMessage:
    'Wallet address received. This endpoint provides guided recovery. On-chain validation requires a TON RPC/indexer on this host.' as const,
  recoveryOptions: ['Seed phrase', 'Backup file', 'Contact support'] as const,
  nextActions: ['Open in Tonkeeper', 'Open in a TON explorer', 'Re-check backup'] as const,
};

export type RecoveryStep = { step: number; action: string };

export const WALLET_RECOVERY_STEPS: RecoveryStep[] = [
  { step: 1, action: 'Confirm you have your seed phrase or a secure backup.' },
  { step: 2, action: 'Verify the wallet address format and network (TON mainnet).' },
  { step: 3, action: 'If you cannot access the wallet, recover using seed phrase in Tonkeeper.' },
  { step: 4, action: 'If the address is known, review balance + history in a TON explorer.' },
];

export function isLikelyRecoveryWallet(v: unknown): v is string {
  if (typeof v !== 'string') return false;
  const s = v.trim();
  if (s.length < 20 || s.length > 80) return false;
  return /^[A-Za-z0-9_\-+=]+$/.test(s);
}

export function parseWalletRecoveryBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const wallet = (body as { wallet?: unknown }).wallet;
  return isLikelyRecoveryWallet(wallet) ? wallet.trim() : null;
}

export function buildWalletRecoveryResponse(wallet: string | null) {
  if (!wallet) {
    return {
      message: WALLET_RECOVERY_PROBE.missingWalletMessage,
      recoverySteps: WALLET_RECOVERY_STEPS,
      options: [...WALLET_RECOVERY_PROBE.recoveryOptions],
    };
  }

  return {
    wallet,
    exists: 'unknown' as const,
    message: WALLET_RECOVERY_PROBE.walletReceivedMessage,
    recoverySteps: WALLET_RECOVERY_STEPS,
    nextActions: [...WALLET_RECOVERY_PROBE.nextActions],
  };
}