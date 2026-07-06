import { asc, inArray } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { corsJson, corsOptions } from '../../lib/http';

export const config = { runtime: 'nodejs' };

const TOTAL_TOKENS = 9000;

type TokenStatus = 'available' | 'reserved' | 'sold';

function statusForId(id: number): TokenStatus {
  if (id % 17 === 0) return 'sold';
  if (id % 11 === 0) return 'reserved';
  return 'available';
}

function parseIdsParam(raw: string): number[] {
  return raw
    .split(',')
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= TOTAL_TOKENS)
    .slice(0, 9000);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');

  if (req.method !== 'GET') {
    return corsJson(req, 405, { ok: false, error: 'Method not allowed' });
  }

  const url = new URL(req.url);
  const all = url.searchParams.get('all') === '1';
  const idsParam = (url.searchParams.get('ids') ?? '').trim();
  const ids = all ? [] : parseIdsParam(idsParam);

  if (!all && ids.length === 0) {
    return corsJson(req, 200, { ok: true, total: TOTAL_TOKENS, tokens: [], source: 'empty' });
  }

  try {
    const db = getDb();
    const rows = all
      ? await db
          .select({
            id: schema.cetuiaTokens.id,
            status: schema.cetuiaTokens.status,
            ownerWalletAddress: schema.cetuiaTokens.ownerWalletAddress,
          })
          .from(schema.cetuiaTokens)
          .orderBy(asc(schema.cetuiaTokens.id))
          .limit(TOTAL_TOKENS)
      : await db
          .select({
            id: schema.cetuiaTokens.id,
            status: schema.cetuiaTokens.status,
            ownerWalletAddress: schema.cetuiaTokens.ownerWalletAddress,
          })
          .from(schema.cetuiaTokens)
          .where(inArray(schema.cetuiaTokens.id, ids))
          .orderBy(asc(schema.cetuiaTokens.id));

    if (all && rows.length === 0) {
      const tokens = Array.from({ length: TOTAL_TOKENS }, (_, i) => i + 1).map((id) => ({ id, status: statusForId(id) }));
      return corsJson(req, 200, { ok: true, total: TOTAL_TOKENS, tokens, source: 'demo' });
    }

    const tokens = rows.map((r) => ({
      id: r.id,
      status: (r.status as TokenStatus) ?? 'available',
      ownerWalletAddress: r.ownerWalletAddress ?? null,
    }));
    return corsJson(req, 200, { ok: true, total: TOTAL_TOKENS, tokens, source: 'db' });
  } catch {
    const tokens = (all ? Array.from({ length: TOTAL_TOKENS }, (_, i) => i + 1) : ids).map((id) => ({ id, status: statusForId(id) }));
    return corsJson(req, 200, { ok: true, total: TOTAL_TOKENS, tokens, source: 'demo' });
  }
}
