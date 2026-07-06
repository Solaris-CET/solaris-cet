import { desc, eq, inArray } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { requireAuth } from '../../lib/auth';
import { jsonResponse, optionsResponse } from '../../lib/http';
import { ensureAllowedOrigin } from '../../lib/originGuard';

export const config = { runtime: 'nodejs' };

type TxRow = {
  id: string;
  source: 'app' | 'onchain';
  occurredAt: string;
  address: string | null;
  kind: string;
  txHash: string | null;
  status: string | null;
  amount: string | null;
};

export default async function handler(req: Request): Promise<Response> {
  const guard = ensureAllowedOrigin(req);
  if (guard instanceof Response) return guard;

  if (req.method === 'OPTIONS') {
    return optionsResponse(req, 'GET, OPTIONS', 'Content-Type, Authorization');
  }
  if (req.method !== 'GET') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  }

  const ctx = await requireAuth(req);
  if ('error' in ctx) return jsonResponse(req, { error: ctx.error }, ctx.status);

  const url = new URL(req.url);
  const limitRaw = url.searchParams.get('limit') ?? '50';
  const limit = Math.max(1, Math.min(200, Number.parseInt(limitRaw, 10) || 50));
  const source = (url.searchParams.get('source') ?? 'all').trim().toLowerCase();

  const db = getDb();
  const rows: TxRow[] = [];

  if (source === 'all' || source === 'app') {
    const appTx = await db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.userId, ctx.user.id))
      .orderBy(desc(schema.transactions.createdAt))
      .limit(limit);
    for (const t of appTx) {
      rows.push({
        id: t.id,
        source: 'app',
        occurredAt: t.createdAt.toISOString(),
        address: null,
        kind: t.type,
        txHash: t.txHash ?? null,
        status: t.status,
        amount: String(t.amount),
      });
    }
  }

  if (source === 'all' || source === 'onchain') {
    const walletRows = await db.select().from(schema.userTonWallets).where(eq(schema.userTonWallets.userId, ctx.user.id));
    const addresses = Array.from(new Set([ctx.user.walletAddress, ...walletRows.map((w) => w.address)].filter(Boolean)));

    if (addresses.length) {
      const onchain = await db
        .select()
        .from(schema.tonIndexedTransactions)
        .where(inArray(schema.tonIndexedTransactions.address, addresses))
        .orderBy(desc(schema.tonIndexedTransactions.occurredAt))
        .limit(limit);
      for (const t of onchain) {
        rows.push({
          id: t.id,
          source: 'onchain',
          occurredAt: t.occurredAt.toISOString(),
          address: t.address,
          kind: t.kind,
          txHash: t.txHash,
          status: null,
          amount: null,
        });
      }
    }
  }

  rows.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  return jsonResponse(req, { ok: true, transactions: rows.slice(0, limit) });
}
