import { asc, inArray } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import {
  CETUIA_TOKENS_PROBE,
  demoStatusForTokenId,
  parseCetuiaTokensAllFlag,
  parseCetuiaTokensIdsParam,
  type CetuiaTokenStatus,
} from '../../lib/cetuiaTokens';
import { corsJson, corsOptions } from '@/api/lib/http';

export { CETUIA_TOKENS_PATH, CETUIA_TOKENS_PROBE } from '@/api/lib/cetuiaTokens';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, CETUIA_TOKENS_PROBE.methods.join(', '));

  if (req.method !== 'GET') {
    return corsJson(req, 405, { ok: false, error: 'Method not allowed' });
  }

  const url = new URL(req.url);
  const all = parseCetuiaTokensAllFlag(url.searchParams);
  const ids = all ? [] : parseCetuiaTokensIdsParam(url.searchParams);

  if (!all && ids.length === 0) {
    return corsJson(req, 200, { ok: true, total: CETUIA_TOKENS_PROBE.totalTokens, tokens: [], source: 'empty' });
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
          .limit(CETUIA_TOKENS_PROBE.totalTokens)
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
      const tokens = Array.from({ length: CETUIA_TOKENS_PROBE.totalTokens }, (_, i) => i + 1).map((id) => ({
        id,
        status: demoStatusForTokenId(id),
      }));
      return corsJson(req, 200, { ok: true, total: CETUIA_TOKENS_PROBE.totalTokens, tokens, source: 'demo' });
    }

    const tokens = rows.map((r) => ({
      id: r.id,
      status: (r.status as CetuiaTokenStatus) ?? 'available',
      ownerWalletAddress: r.ownerWalletAddress ?? null,
    }));
    return corsJson(req, 200, { ok: true, total: CETUIA_TOKENS_PROBE.totalTokens, tokens, source: 'db' });
  } catch {
    const tokens = (all ? Array.from({ length: CETUIA_TOKENS_PROBE.totalTokens }, (_, i) => i + 1) : ids).map((id) => ({
      id,
      status: demoStatusForTokenId(id),
    }));
    return corsJson(req, 200, { ok: true, total: CETUIA_TOKENS_PROBE.totalTokens, tokens, source: 'demo' });
  }
}