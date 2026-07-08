// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  buildPublicV2TransactionsListBody,
  PUBLIC_V2_TRANSACTIONS_PATH,
  PUBLIC_V2_TRANSACTIONS_PROBE,
  publicV2TransactionCreateSchema,
  resolvePublicV2TransactionsRateLimit,
} from '../../api/lib/publicV2Transactions';

vi.mock('../../api/lib/publicApiAuth', () => ({
  requirePublicApiKey: async () => ({ apiKeyId: 'key-1', userId: 'user-1', apiKeyName: 'test', apiKeyPrefix: 'sk_test' }),
}));

vi.mock('../../api/lib/publicApiMetrics', () => ({
  recordPublicApiUsage: async () => undefined,
}));

vi.mock('../../api/lib/publicApiRateLimit', () => ({
  decideRateLimit: () => ({ ok: true, limit: 240, remaining: 239, reset: Date.now() + 60_000 }),
  rateLimitHeaders: () => ({ 'X-RateLimit-Limit': '240' }),
}));

vi.mock('../../api/lib/publicTransactionsStore', () => ({
  listTransactions: () => ({ items: [{ id: 'tx-v2' }], nextCursor: 'c1' }),
  createTransaction: (data: unknown) => ({ id: 'tx-new-v2', ...(data as object) }),
}));

vi.mock('../../api/lib/publicWebhooksStore', () => ({
  emitWebhookEvent: async () => undefined,
}));

import publicV2TransactionsRoute, { PUBLIC_V2_TRANSACTIONS_PROBE as routeProbe } from '../../api/v2/transactions/route';

describe('publicV2Transactions helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(PUBLIC_V2_TRANSACTIONS_PROBE.path).toBe('/api/v2/transactions');
    expect(routeProbe.getRateLimit).toBe(240);
  });

  it('schema accepts metadata and list body uses page cursor', () => {
    expect(publicV2TransactionCreateSchema.safeParse({ amount: '1', metadata: { ref: 'x' } }).success).toBe(true);
    expect(resolvePublicV2TransactionsRateLimit('GET')).toBe(240);
    expect(buildPublicV2TransactionsListBody([], 'c1').page.nextCursor).toBe('c1');
  });
});

describe('/api/v2/transactions e2e probe', () => {
  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(PUBLIC_V2_TRANSACTIONS_PATH);
    expect(src).toContain('api/v2/transactions/route.js');
  });

  it('GET lists v2 transactions', async () => {
    const res = await publicV2TransactionsRoute(
      new Request(`http://test${PUBLIC_V2_TRANSACTIONS_PATH}`, { method: 'GET', headers: { 'X-API-Key': 'sk_test_key' } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Array<{ id: string }> };
    expect(body.data[0]?.id).toBe('tx-v2');
  });
});