export const TON_BALANCE_PATH = '/api/ton/balance';
export const TON_BALANCE_METHODS = 'GET, OPTIONS';

export const TON_BALANCE_PROBE = {
  path: TON_BALANCE_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  queryParams: ['address', 'network'] as const,
  cacheControl: 'no-store' as const,
  includeJettonWallet: true as const,
};

export { fetchTonAccountBalances, resolveCetJettonMaster } from './tonBalanceShared';