// @vitest-environment node
import { authRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  ACCOUNT_TRANSACTIONS_PATH,
  ACCOUNT_TRANSACTIONS_PROBE,
  parseTransactionQuery,
} from '../../api/lib/accountTransactions';

const mocks = vi.hoisted(() => {
  const user = {
    id: 'user-1',
    walletAddress: 'EQ_PRIMARY',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const state = {
    appTx: [
      {
        id: 'app-tx-1',
        userId: 'user-1',
        type: 'transfer',
        amount: '12.5',
        status: 'confirmed',
        txHash: 'hash-app',
        createdAt: new Date('2026-03-01T10:00:00Z'),
      },
    ],
    wallets: [{ userId: 'user-1', address: 'EQ_LINKED' }],
    onchain: [
      {
        id: 'chain-tx-1',
        address: 'EQ_PRIMARY',
        kind: 'receive',
        txHash: 'hash-chain',
        occurredAt: new Date('2026-03-02T10:00:00Z'),
      },
    ],
  };

  const schema = {
    transactions: { userId: 'transactions.userId' },
    userTonWallets: { userId: 'userTonWallets.userId' },
    tonIndexedTransactions: { address: 'tonIndexedTransactions.address' },
  };

  const db = {
    select() {
      return {
        from(table: unknown) {
          return {
            where() {
              if (table === schema.userTonWallets) {
                return Promise.resolve(state.wallets);
              }
              return {
                orderBy() {
                  return {
                    limit: async () => {
                      if (table === schema.transactions) return state.appTx;
                      if (table === schema.tonIndexedTransactions) return state.onchain;
                      return [];
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };

  return { db, schema, state, user };
});

vi.mock('../../db/client', () => ({
  getDb: () => mocks.db,
  schema: mocks.schema,
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return { user: mocks.user, sid: null, mfaEnabled: false };
  },
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/originGuard', () => ({
  ensureAllowedOrigin: () => ({ allowedOrigin: 'https://allowed.test' }),
}));

import accountTransactionsRoute, { ACCOUNT_TRANSACTIONS_PROBE as routeProbe } from '../../api/account/transactions/route';

describe('accountTransactions helpers', () => {
  it('parseTransactionQuery clamps limit and normalizes source', () => {
    const params = new URLSearchParams('limit=999&source=APP');
    expect(parseTransactionQuery(params)).toEqual({ limit: 200, source: 'app' });
    expect(parseTransactionQuery(new URLSearchParams('source=unknown'))).toEqual({ limit: 50, source: 'all' });
  });

  it('exports stable e2e probe contract', () => {
    expect(ACCOUNT_TRANSACTIONS_PROBE.path).toBe('/api/account/transactions');
    expect(routeProbe.authRequired).toBe(true);
    expect(routeProbe.methods).toEqual(['GET', 'OPTIONS']);
  });
});

describe('/api/account/transactions e2e probe', () => {
  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ACCOUNT_TRANSACTIONS_PATH);
    expect(src).toContain('api/account/transactions/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await accountTransactionsRoute(
      new Request(`http://test${ACCOUNT_TRANSACTIONS_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('GET requires Authorization bearer token', async () => {
    const res = await accountTransactionsRoute(
      new Request(`http://test${ACCOUNT_TRANSACTIONS_PATH}`, {
        method: 'GET',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(401);
  });

  it('GET merges app and onchain transactions sorted by date', async () => {
    const res = await accountTransactionsRoute(
      authRequest(`${ACCOUNT_TRANSACTIONS_PATH}?limit=10&source=all`),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      transactions: Array<{ id: string; source: string }>;
    };
    expect(body.ok).toBe(true);
    expect(body.transactions).toHaveLength(2);
    expect(body.transactions[0]?.source).toBe('onchain');
    expect(body.transactions[1]?.source).toBe('app');
  });

  it('GET filters app-only source', async () => {
    const res = await accountTransactionsRoute(
      authRequest(`${ACCOUNT_TRANSACTIONS_PATH}?source=app`),
    );
    const body = (await res.json()) as { transactions: Array<{ source: string }> };
    expect(body.transactions.every((tx) => tx.source === 'app')).toBe(true);
  });

  it('POST returns 405', async () => {
    const res = await accountTransactionsRoute(
      new Request(`http://test${ACCOUNT_TRANSACTIONS_PATH}`, {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token', origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(405);
  });
});