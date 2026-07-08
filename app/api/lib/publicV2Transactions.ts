import { z } from 'zod';

export const PUBLIC_V2_TRANSACTIONS_PATH = '/api/v2/transactions';
export const PUBLIC_V2_TRANSACTIONS_METHODS = 'GET, POST, OPTIONS';

export const PUBLIC_V2_TRANSACTIONS_PROBE = {
  path: PUBLIC_V2_TRANSACTIONS_PATH,
  methods: ['GET', 'POST', 'OPTIONS'] as const,
  authRequired: true,
  apiVersion: 'v2' as const,
  rateLimitBucket: 'public-v2-transactions' as const,
  getRateLimit: 240,
  postRateLimit: 60,
  rateWindowSeconds: 60,
  defaultLimit: 50,
  webhookEvent: 'transaction.created' as const,
};

export const publicV2TransactionCreateSchema = z.object({
  from: z.string().trim().min(1).max(120).optional().nullable(),
  to: z.string().trim().min(1).max(120).optional().nullable(),
  amount: z.string().trim().min(1).max(80),
  txHash: z.string().trim().min(1).max(160).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export function buildPublicV2TransactionsListBody(items: unknown[], nextCursor: string | null) {
  return { version: PUBLIC_V2_TRANSACTIONS_PROBE.apiVersion, data: items, page: { nextCursor } };
}

export function buildPublicV2TransactionCreateBody(transaction: unknown, metadata: Record<string, unknown> | null | undefined) {
  return {
    version: PUBLIC_V2_TRANSACTIONS_PROBE.apiVersion,
    transaction,
    received: { metadata: metadata ?? null },
  };
}

export function resolvePublicV2TransactionsRateLimit(method: string): number {
  return method === 'POST' ? PUBLIC_V2_TRANSACTIONS_PROBE.postRateLimit : PUBLIC_V2_TRANSACTIONS_PROBE.getRateLimit;
}