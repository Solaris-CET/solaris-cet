export const WALLETS_PATH = '/api/wallets';
export const WALLETS_METHODS = 'GET, DELETE, OPTIONS';

export const WALLETS_PROBE = {
  path: WALLETS_PATH,
  methods: ['GET', 'DELETE', 'OPTIONS'] as const,
  authRequired: true,
  allowHeaders: 'Content-Type, Authorization' as const,
  addressParam: 'address' as const,
  missingAddressError: 'Missing address' as const,
  cannotUnlinkPrimaryError: 'Cannot unlink primary wallet' as const,
};

export type WalletRow = {
  address: string;
  label: string | null;
  isPrimary: boolean;
};

export function mergeUserWallets(primary: string, rows: Array<{ address: string; label: string | null; isPrimary: boolean }>): WalletRow[] {
  const wallets: WalletRow[] = [];
  const hasPrimaryInTable = rows.some((r) => r.address === primary);
  if (!hasPrimaryInTable) {
    wallets.push({ address: primary, label: null, isPrimary: true });
  }
  for (const r of rows) {
    wallets.push({
      address: r.address,
      label: r.label ?? null,
      isPrimary: r.address === primary || Boolean(r.isPrimary),
    });
  }

  const uniq = new Map<string, WalletRow>();
  for (const w of wallets) {
    const prev = uniq.get(w.address);
    if (!prev) uniq.set(w.address, w);
    else uniq.set(w.address, { ...prev, ...w, isPrimary: prev.isPrimary || w.isPrimary });
  }
  return Array.from(uniq.values());
}

export function buildWalletsListResponse(wallets: WalletRow[]) {
  return { ok: true as const, wallets };
}

export function parseWalletsDeleteAddress(url: URL): string {
  return (url.searchParams.get(WALLETS_PROBE.addressParam) ?? '').trim();
}

export type WalletsDeleteValidation =
  | { ok: true; address: string }
  | { ok: false; status: 400 | 409; error: string };

export function validateWalletsDelete(address: string, primary: string): WalletsDeleteValidation {
  if (!address) return { ok: false, status: 400, error: WALLETS_PROBE.missingAddressError };
  if (address === primary) return { ok: false, status: 409, error: WALLETS_PROBE.cannotUnlinkPrimaryError };
  return { ok: true, address };
}

export function buildWalletsUnlinkTelegramMessage(address: string): string {
  return `Wallet eliminat: ${address.slice(0, 10)}…`;
}