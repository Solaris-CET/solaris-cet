import { z } from 'zod';

export const PUBLIC_V1_TRANSACTIONS_PATH = '/api/v1/transactions';
export const PUBLIC_V1_TRANSACTIONS_METHODS = 'GET, POST, OPTIONS';

export const PUBLIC_V1_TRANSACTIONS_PROBE = {
  path: PUBLIC_V1_TRANSACTIONS_PATH,
  methods: ['GET', 'POST', 'OPTIONS'] as const,
  authRequired: true,
  apiVersion: 'v1' as const,
  rateLimitBucket: 'public-v1-transactions' as const,
  getRateLimit: 120,
  postRateLimit: 30,
  rateWindowSeconds: 60,
  defaultLimit: 50,
  webhookEvent: 'transaction.created' as const,
};

export const publicV1TransactionCreateSchema = z.object({
  from: z.string().trim().min(1).max(120).optional().nullable(),
  to: z.string().trim().min(1).max(120).optional().nullable(),
  amount: z.string().trim().min(1).max(80),
  txHash: z.string().trim().min(1).max(160).optional().nullable(),
});

export function buildPublicV1TransactionsListBody(items: unknown[], nextCursor: string | null) {
  return { version: PUBLIC_V1_TRANSACTIONS_PROBE.apiVersion, items, nextCursor };
}

export function buildPublicV1TransactionCreateBody(transaction: unknown) {
  return { version: PUBLIC_V1_TRANSACTIONS_PROBE.apiVersion, transaction };
}

export function resolvePublicV1TransactionsRateLimit(method: string): number {
  return method === 'POST' ? PUBLIC_V1_TRANSACTIONS_PROBE.postRateLimit : PUBLIC_V1_TRANSACTIONS_PROBE.getRateLimit;
}