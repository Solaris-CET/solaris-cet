export const ADMIN_CETUIA_TOKENS_PATH = '/api/admin/cetuia/tokens';
export const ADMIN_CETUIA_TOKENS_METHODS = 'GET, PUT, OPTIONS';

export const ADMIN_CETUIA_TOKEN_STATUSES = ['available', 'reserved', 'sold'] as const;
export type CetuiaTokenStatus = (typeof ADMIN_CETUIA_TOKEN_STATUSES)[number];

const VALID_STATUSES = new Set<string>(ADMIN_CETUIA_TOKEN_STATUSES);

export const ADMIN_CETUIA_TOKENS_PROBE = {
  path: ADMIN_CETUIA_TOKENS_PATH,
  methods: ['GET', 'PUT', 'OPTIONS'] as const,
  authRequired: true,
  getMinRole: 'viewer' as const,
  putMinRole: 'editor' as const,
  unauthenticatedStatus: 401,
  totalTokens: 9000,
  auditAction: 'CETUIA_TOKEN_UPDATED' as const,
  statuses: ADMIN_CETUIA_TOKEN_STATUSES,
};

export function isCetuiaTokensDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function parseCetuiaTokenId(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return null;
  if (n < 1 || n > ADMIN_CETUIA_TOKENS_PROBE.totalTokens) return null;
  return n;
}

export function parseCetuiaTokenStatus(v: unknown): CetuiaTokenStatus | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return VALID_STATUSES.has(s) ? (s as CetuiaTokenStatus) : null;
}

export function parseCetuiaTokenOwner(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s) return null;
  if (s.length > 200) return null;
  return s;
}

export function computeCetuiaAvailableCount(_total: number, sold: number, reserved: number): number {
  return Math.max(0, ADMIN_CETUIA_TOKENS_PROBE.totalTokens - sold - reserved);
}