import { sql } from 'drizzle-orm';

import { getDb, schema } from '../../../../db/client';
import { writeAdminAudit } from '../../../lib/adminAudit';
import { requireAdminAuth, requireAdminRole } from '../../../lib/adminAuth';
import { corsJson, corsOptions } from '../../../lib/http';

export const config = { runtime: 'nodejs' };

const TOTAL_TOKENS = 9000;

async function countTokens(): Promise<number> {
  const db = getDb();
  const [row] = await db.select({ c: sql<number>`count(*)`.as('c') }).from(schema.cetuiaTokens);
  return row?.c ?? 0;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');

  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });
  if (!process.env.DATABASE_URL?.trim()) return corsJson(req, 503, { error: 'Unavailable' });

  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const ok = requireAdminRole(ctx, 'admin');
  if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });

  const before = await countTokens().catch(() => 0);
  const db = getDb();

  const batchSize = 750;
  for (let start = 1; start <= TOTAL_TOKENS; start += batchSize) {
    const end = Math.min(TOTAL_TOKENS, start + batchSize - 1);
    const values = Array.from({ length: end - start + 1 }, (_, i) => ({ id: start + i }));
    await db.insert(schema.cetuiaTokens).values(values).onConflictDoNothing();
  }

  const after = await countTokens().catch(() => before);
  await writeAdminAudit(req, ctx, 'CETUIA_TOKENS_SEEDED', 'cetuia_tokens', 'all', { before, after, total: TOTAL_TOKENS });

  return corsJson(req, 200, { ok: true, before, after, total: TOTAL_TOKENS });
}

