export const AI_HISTORY_PATH = '/api/ai/history';
export const AI_HISTORY_METHODS = 'GET, OPTIONS';

export const AI_HISTORY_PROBE = {
  path: AI_HISTORY_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  maxConversations: 50,
};