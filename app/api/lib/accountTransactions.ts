export const ACCOUNT_TRANSACTIONS_PATH = '/api/account/transactions';
export const ACCOUNT_TRANSACTIONS_METHODS = 'GET, OPTIONS';

export const ACCOUNT_TRANSACTIONS_PROBE = {
  path: ACCOUNT_TRANSACTIONS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  defaultLimit: 50,
  maxLimit: 200,
};

export type TransactionSource = 'all' | 'app' | 'onchain';

export type TransactionQuery = {
  limit: number;
  source: TransactionSource;
};

export function parseTransactionQuery(searchParams: URLSearchParams): TransactionQuery {
  const limitRaw = searchParams.get('limit') ?? String(ACCOUNT_TRANSACTIONS_PROBE.defaultLimit);
  const limit = Math.max(
    1,
    Math.min(ACCOUNT_TRANSACTIONS_PROBE.maxLimit, Number.parseInt(limitRaw, 10) || ACCOUNT_TRANSACTIONS_PROBE.defaultLimit),
  );
  const sourceRaw = (searchParams.get('source') ?? 'all').trim().toLowerCase();
  const source: TransactionSource =
    sourceRaw === 'app' || sourceRaw === 'onchain' ? sourceRaw : 'all';
  return { limit, source };
}

export function isTransactionSource(value: string): value is TransactionSource {
  return value === 'all' || value === 'app' || value === 'onchain';
}