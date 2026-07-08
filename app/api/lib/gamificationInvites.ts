export const GAMIFICATION_INVITES_PATH = '/api/gamification/invites';
export const GAMIFICATION_INVITES_METHODS = 'GET, OPTIONS';

export const GAMIFICATION_INVITES_PROBE = {
  path: GAMIFICATION_INVITES_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  listLimit: 50,
};