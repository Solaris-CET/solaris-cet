// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  buildPublicV1TransactionsListBody,
  PUBLIC_V1_TRANSACTIONS_PATH,
  PUBLIC_V1_TRANSACTIONS_PROBE,
  publicV1TransactionCreateSchema,
  resolvePublicV1TransactionsRateLimit,
} from '../../api/lib/publicV1Transactions';

vi.mock('../../api/lib/publicApiAuth', () => ({
  requirePublicApiKey: async () => ({ apiKeyId: 'key-1', userId: 'user-1', apiKeyName: 'test', apiKeyPrefix: 'sk_test' }),
}));

vi.mock('../../api/lib/publicApiMetrics', () => ({
  recordPublicApiUsage: async () => undefined,
}));

vi.mock('../../api/lib/publicApiRateLimit', () => ({
  decideRateLimit: () => ({ ok: true, limit: 120, remaining: 119, reset: Date.now() + 60_000 }),
  rateLimitHeaders: () => ({ 'X-RateLimit-Limit': '120' }),
}));

vi.mock('../../api/lib/publicTransactionsStore', () => ({
  listTransactions: () => ({ items: [{ id: 'tx-1' }], nextCursor: null }),
  createTransaction: (data: unknown) => ({ id: 'tx-new', ...(data as object) }),
}));

vi.mock('../../api/lib/publicWebhooksStore', () => ({
  emitWebhookEvent: async () => undefined,
}));

import publicV1TransactionsRoute, { PUBLIC_V1_TRANSACTIONS_PROBE as routeProbe } from '../../api/v1/transactions/route';

function txRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('X-API-Key', 'sk_test_key');
  return new Request(`http://test${PUBLIC_V1_TRANSACTIONS_PATH}`, { ...init, headers });
}

describe('publicV1Transactions helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(PUBLIC_V1_TRANSACTIONS_PROBE.path).toBe('/api/v1/transactions');
    expect(routeProbe.webhookEvent).toBe('transaction.created');
  });

  it('schema validates create payload', () => {
    expect(publicV1TransactionCreateSchema.safeParse({ amount: '10' }).success).toBe(true);
    expect(resolvePublicV1TransactionsRateLimit('POST')).toBe(30);
    expect(buildPublicV1TransactionsListBody([], null).version).toBe('v1');
  });
});

describe('/api/v1/transactions e2e probe', () => {
  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(PUBLIC_V1_TRANSACTIONS_PATH);
    expect(src).toContain('api/v1/transactions/route.js');
  });

  it('GET lists transactions', async () => {
    const res = await publicV1TransactionsRoute(txRequest({ method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { version: string; items: Array<{ id: string }> };
    expect(body.items[0]?.id).toBe('tx-1');
  });

  it('POST creates transaction', async () => {
    const res = await publicV1TransactionsRoute(
      txRequest({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: '5' }) }),
    );
    expect(res.status).toBe(201);
  });
});