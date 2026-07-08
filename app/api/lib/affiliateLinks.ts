export const AFFILIATE_LINKS_PATH = '/api/gamification/affiliate/links';
export const AFFILIATE_LINKS_METHODS = 'GET, POST, OPTIONS';

export const AFFILIATE_LINKS_PROBE = {
  path: AFFILIATE_LINKS_PATH,
  methods: ['GET', 'POST', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  listLimit: 50,
  maxCodeAttempts: 6,
  clicksLookbackDays: 7,
  codeGenerationError: 'Could not generate code' as const,
};