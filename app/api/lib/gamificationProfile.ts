export const GAMIFICATION_PROFILE_PATH = '/api/gamification/profile';
export const GAMIFICATION_PROFILE_METHODS = 'GET, OPTIONS';

export const GAMIFICATION_PROFILE_PROBE = {
  path: GAMIFICATION_PROFILE_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  walletParam: 'wallet' as const,
  invalidWalletError: 'Invalid wallet' as const,
  notFoundError: 'Not found' as const,
  badgesLimit: 50,
};

export function parseGamificationProfileWallet(searchParams: URLSearchParams): string {
  return (searchParams.get(GAMIFICATION_PROFILE_PROBE.walletParam) ?? '').trim();
}