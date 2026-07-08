export const REWARDS_WEEKLY_PATH = '/api/gamification/rewards/weekly';
export const REWARDS_WEEKLY_METHODS = 'GET, OPTIONS';

export const REWARDS_WEEKLY_PROBE = {
  path: REWARDS_WEEKLY_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  listLimit: 50,
};