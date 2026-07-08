export const ADMIN_CETUIA_SEED_PATH = '/api/admin/cetuia/seed';
export const ADMIN_CETUIA_SEED_METHODS = 'POST, OPTIONS';

export const ADMIN_CETUIA_SEED_PROBE = {
  path: ADMIN_CETUIA_SEED_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  minRole: 'admin' as const,
  unauthenticatedStatus: 401,
  auditAction: 'CETUIA_TOKENS_SEEDED' as const,
  totalTokens: 9000,
  batchSize: 750,
};

export function isCetuiaSeedDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}