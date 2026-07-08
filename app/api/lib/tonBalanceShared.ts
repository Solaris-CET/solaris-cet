import { fetchTonapiJson, parseTonNetwork, type TonNetwork } from './tonapi';
import { fetchToncenterAddressBalance, getToncenterRpcUrl, withToncenterApiKey } from './toncenter';

export const CET_JETTON_MASTER_ADDRESS_MAINNET = 'EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX';

export const TON_BALANCE_FETCH_TIMEOUT_MS = 4500;

export function resolveCetJettonMaster(env: NodeJS.ProcessEnv = process.env): string {
  return (env.CET_JETTON_MASTER_ADDRESS ?? '').trim() || CET_JETTON_MASTER_ADDRESS_MAINNET;
}

export function extractTonBalanceNanoFromTonapiAccount(data: { balance?: unknown } | null | undefined): string | null {
  if (!data) return null;
  const bal = data.balance;
  if (typeof bal === 'string' || typeof bal === 'number') return String(bal);
  return null;
}

function jettonAddressFromItem(obj: Record<string, unknown>): string {
  const jetton = obj.jetton;
  return jetton && typeof jetton === 'object' && 'address' in jetton && typeof (jetton as { address?: unknown }).address === 'string'
    ? (jetton as { address: string }).address
    : '';
}

export function extractCetBalanceNanoFromTonapiJettons(
  data: { balances?: unknown } | null | undefined,
  cetMaster: string,
): string | null {
  if (!data) return null;
  const raw = data.balances;
  if (!Array.isArray(raw)) return null;
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;
    if (jettonAddressFromItem(obj) !== cetMaster) continue;
    const bal = obj.balance;
    if (typeof bal === 'string' || typeof bal === 'number') return String(bal);
    return null;
  }
  return null;
}

export function extractCetJettonWalletAddressFromTonapiJettons(
  data: { balances?: unknown } | null | undefined,
  cetMaster: string,
): string | null {
  if (!data) return null;
  const raw = data.balances;
  if (!Array.isArray(raw)) return null;
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;
    if (jettonAddressFromItem(obj) !== cetMaster) continue;
    const candidate =
      (obj.wallet_address as unknown) ??
      (obj.walletAddress as unknown) ??
      (obj.jetton_wallet as unknown) ??
      (obj.jettonWallet as unknown);
    if (typeof candidate === 'string') return candidate.trim() || null;
    if (candidate && typeof candidate === 'object') {
      const addr =
        'address' in (candidate as Record<string, unknown>) && typeof (candidate as { address?: unknown }).address === 'string'
          ? (candidate as { address: string }).address.trim()
          : '';
      return addr || null;
    }
    return null;
  }
  return null;
}

export type TonBalanceSuccess = {
  ok: true;
  address: string;
  tonBalanceNano: string | null;
  cetBalanceNano: string | null;
  cetJettonWalletAddress?: string | null;
  source: 'tonapi' | 'toncenter';
  network: TonNetwork;
};

export type TonBalanceFailure = {
  ok: false;
  address: string;
  error: 'unavailable';
  cetBalanceNano: null;
  cetJettonWalletAddress?: null;
};

export async function fetchTonAccountBalances(
  address: string,
  networkRaw: string | null,
  options?: { includeJettonWallet?: boolean; env?: NodeJS.ProcessEnv },
): Promise<TonBalanceSuccess | TonBalanceFailure> {
  const network = parseTonNetwork(networkRaw);
  const cetMaster = resolveCetJettonMaster(options?.env);
  const includeJettonWallet = options?.includeJettonWallet ?? false;

  const tonapiAccount = await fetchTonapiJson<{ balance?: unknown }>(
    network,
    `/v2/accounts/${encodeURIComponent(address)}`,
    { timeoutMs: TON_BALANCE_FETCH_TIMEOUT_MS },
  );

  const tonapiJettons = await fetchTonapiJson<{ balances?: unknown }>(
    network,
    `/v2/accounts/${encodeURIComponent(address)}/jettons`,
    { timeoutMs: TON_BALANCE_FETCH_TIMEOUT_MS },
  );

  const tonBalanceNanoFromTonapi = tonapiAccount.ok ? extractTonBalanceNanoFromTonapiAccount(tonapiAccount.data) : null;
  const cetBalanceNanoFromTonapi = tonapiJettons.ok
    ? extractCetBalanceNanoFromTonapiJettons(tonapiJettons.data, cetMaster)
    : null;
  const cetJettonWalletAddressFromTonapi =
    includeJettonWallet && tonapiJettons.ok
      ? extractCetJettonWalletAddressFromTonapiJettons(tonapiJettons.data, cetMaster)
      : null;

  if (tonBalanceNanoFromTonapi != null || cetBalanceNanoFromTonapi != null) {
    return {
      ok: true,
      address,
      tonBalanceNano: tonBalanceNanoFromTonapi,
      cetBalanceNano: cetBalanceNanoFromTonapi,
      ...(includeJettonWallet ? { cetJettonWalletAddress: cetJettonWalletAddressFromTonapi } : {}),
      source: 'tonapi',
      network,
    };
  }

  try {
    const base = getToncenterRpcUrl();
    const withKey = withToncenterApiKey(base);
    let tonBalanceNano: string | null = await fetchToncenterAddressBalance(withKey, address, {
      timeoutMs: TON_BALANCE_FETCH_TIMEOUT_MS,
    });
    if (tonBalanceNano == null && withKey.toString() !== base.toString()) {
      tonBalanceNano = await fetchToncenterAddressBalance(base, address, { timeoutMs: TON_BALANCE_FETCH_TIMEOUT_MS });
    }

    if (tonBalanceNano == null) {
      return {
        ok: false,
        address,
        error: 'unavailable',
        cetBalanceNano: null,
        ...(includeJettonWallet ? { cetJettonWalletAddress: null } : {}),
      };
    }

    return {
      ok: true,
      address,
      tonBalanceNano,
      cetBalanceNano: null,
      ...(includeJettonWallet ? { cetJettonWalletAddress: null } : {}),
      source: 'toncenter',
      network,
    };
  } catch {
    return {
      ok: false,
      address,
      error: 'unavailable',
      cetBalanceNano: null,
      ...(includeJettonWallet ? { cetJettonWalletAddress: null } : {}),
    };
  }
}