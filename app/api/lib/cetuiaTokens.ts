export const CETUIA_TOKENS_PATH = '/api/cetuia/tokens';
export const CETUIA_TOKENS_METHODS = 'GET, OPTIONS';

export const CETUIA_TOKEN_STATUSES = ['available', 'reserved', 'sold'] as const;
export type CetuiaTokenStatus = (typeof CETUIA_TOKEN_STATUSES)[number];

export const CETUIA_TOKENS_PROBE = {
  path: CETUIA_TOKENS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  totalTokens: 9000,
  maxIdsPerRequest: 9000,
  statuses: CETUIA_TOKEN_STATUSES,
};

export function demoStatusForTokenId(id: number): CetuiaTokenStatus {
  if (id % 17 === 0) return 'sold';
  if (id % 11 === 0) return 'reserved';
  return 'available';
}

export function parseCetuiaTokenIdsParam(raw: string): number[] {
  return raw
    .split(',')
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= CETUIA_TOKENS_PROBE.totalTokens)
    .slice(0, CETUIA_TOKENS_PROBE.maxIdsPerRequest);
}

export function parseCetuiaTokensAllFlag(searchParams: URLSearchParams): boolean {
  return searchParams.get('all') === '1';
}

export function parseCetuiaTokensIdsParam(searchParams: URLSearchParams): number[] {
  return parseCetuiaTokenIdsParam((searchParams.get('ids') ?? '').trim());
}