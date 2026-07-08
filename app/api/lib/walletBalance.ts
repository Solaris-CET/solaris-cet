export const WALLET_BALANCE_PATH = '/api/wallet/balance';
export const WALLET_BALANCE_METHODS = 'GET, OPTIONS';

export const WALLET_BALANCE_PROBE = {
  path: WALLET_BALANCE_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  runtime: 'edge' as const,
  queryParams: ['address', 'network'] as const,
  cacheControl: 'no-store' as const,
  includeJettonWallet: false as const,
};

export { fetchTonAccountBalances } from './tonBalanceShared';