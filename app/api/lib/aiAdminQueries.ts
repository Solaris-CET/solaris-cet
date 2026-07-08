export const AI_ADMIN_QUERIES_PATH = '/api/ai/admin/queries';
export const AI_ADMIN_QUERIES_METHODS = 'GET, OPTIONS';

export const AI_ADMIN_QUERIES_PROBE = {
  path: AI_ADMIN_QUERIES_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  adminRequired: true,
  maxListRows: 500,
  maxQueryPreviewLength: 400,
  userHashLength: 10,
};

export function anonymizeAiAdminUserId(userId: string | null | undefined, hash: (v: string) => string): string {
  return userId ? hash(userId).slice(0, AI_ADMIN_QUERIES_PROBE.userHashLength) : 'anon';
}