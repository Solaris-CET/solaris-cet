import { and, desc, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { parseTonNetwork, type TonNetwork } from './tonapi';

export const TON_INDEXED_TXS_PATH = '/api/ton/indexed-txs';
export const TON_INDEXED_TXS_METHODS = 'GET, OPTIONS';

export const TON_INDEXED_TXS_PROBE = {
  path: TON_INDEXED_TXS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  queryParams: ['address', 'network', 'limit'] as const,
  rateLimitKey: 'ton-indexed-txs' as const,
  rateLimit: 120,
  rateWindowSeconds: 60,
  defaultLimit: 50,
  maxLimit: 100,
  minLimit: 1,
};

export function parseTonIndexedTxsLimit(value: string | null, fallback = TON_INDEXED_TXS_PROBE.defaultLimit): number {
  const raw = (value ?? '').trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

export function clampTonIndexedTxsLimit(n: number): number {
  return Math.max(TON_INDEXED_TXS_PROBE.minLimit, Math.min(TON_INDEXED_TXS_PROBE.maxLimit, n));
}

export type TonIndexedTxItem = {
  txHash: string;
  kind: string;
  occurredAt: string;
};

export async function listTonIndexedTransactions(
  address: string,
  networkRaw: string | null,
  limitRaw: string | null,
): Promise<{ network: TonNetwork; address: string; items: TonIndexedTxItem[] }> {
  const network = parseTonNetwork(networkRaw);
  const limit = clampTonIndexedTxsLimit(parseTonIndexedTxsLimit(limitRaw));

  const db = getDb();
  const rows = await db
    .select({
      txHash: schema.tonIndexedTransactions.txHash,
      kind: schema.tonIndexedTransactions.kind,
      occurredAt: schema.tonIndexedTransactions.occurredAt,
    })
    .from(schema.tonIndexedTransactions)
    .where(and(eq(schema.tonIndexedTransactions.network, network), eq(schema.tonIndexedTransactions.address, address)))
    .orderBy(desc(schema.tonIndexedTransactions.occurredAt))
    .limit(limit);

  const items = rows.map((r) => ({
    txHash: r.txHash,
    kind: r.kind,
    occurredAt: r.occurredAt.toISOString(),
  }));

  return { network, address, items };
}