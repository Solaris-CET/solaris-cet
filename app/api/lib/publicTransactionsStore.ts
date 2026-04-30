import { randomUUID } from 'node:crypto';

export type PublicTransaction = {
  id: string;
  asset: 'CET';
  from: string | null;
  to: string | null;
  amount: string;
  status: 'pending' | 'confirmed' | 'failed';
  txHash: string | null;
  createdAt: string;
};

const maxTx = 5000;
const txs: PublicTransaction[] = [];

function pushTx(t: PublicTransaction) {
  txs.unshift(t);
  if (txs.length > maxTx) txs.splice(maxTx);
}

export function listTransactions(opts: { limit: number; cursor?: string | null }): { items: PublicTransaction[]; nextCursor: string | null } {
  const limit = Math.min(200, Math.max(1, Math.floor(opts.limit || 50)));
  const start = opts.cursor ? txs.findIndex((t) => t.id === opts.cursor) + 1 : 0;
  const items = txs.slice(Math.max(0, start), Math.max(0, start) + limit);
  const nextCursor = items.length === limit ? items[items.length - 1]?.id ?? null : null;
  return { items, nextCursor };
}

export function createTransaction(input: {
  from?: string | null;
  to?: string | null;
  amount: string;
  txHash?: string | null;
}): PublicTransaction {
  const now = new Date();
  const t: PublicTransaction = {
    id: randomUUID(),
    asset: 'CET',
    from: input.from ?? null,
    to: input.to ?? null,
    amount: input.amount,
    status: 'pending',
    txHash: input.txHash ?? null,
    createdAt: now.toISOString(),
  };
  pushTx(t);
  return t;
}

export function updateTransactionStatus(id: string, status: PublicTransaction['status']): PublicTransaction | null {
  const idx = txs.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  const current = txs[idx];
  if (!current) return null;
  const updated: PublicTransaction = { ...current, status };
  txs[idx] = updated;
  return updated;
}

