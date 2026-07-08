export const GAMIFICATION_VISIT_PATH = '/api/gamification/visit';
export const GAMIFICATION_VISIT_METHODS = 'POST, OPTIONS';

export const GAMIFICATION_VISIT_PROBE = {
  path: GAMIFICATION_VISIT_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  visitPoints: 1,
  visitReason: 'visit' as const,
};