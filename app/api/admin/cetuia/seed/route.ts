import { sql } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { writeAdminAudit } from '@/api/lib/adminAudit';
import { guardAdminRoute } from '@/api/lib/adminAuth';
import {
  ADMIN_CETUIA_SEED_PROBE,
  isCetuiaSeedDatabaseConfigured,
} from '../../../lib/adminCetuiaSeed';
import { corsJson, corsOptions } from '@/api/lib/http';

export { ADMIN_CETUIA_SEED_PATH, ADMIN_CETUIA_SEED_PROBE } from '@/api/lib/adminCetuiaSeed';

export const config = { runtime: 'nodejs' };

async function countTokens(): Promise<number> {
  const db = getDb();
  const [row] = await db.select({ c: sql<number>`count(*)`.as('c') }).from(schema.cetuiaTokens);
  return row?.c ?? 0;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });
  if (!isCetuiaSeedDatabaseConfigured()) return corsJson(req, 503, { error: 'Unavailable' });

  const ctx = await guardAdminRoute(req, { minRole: ADMIN_CETUIA_SEED_PROBE.minRole });
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  const before = await countTokens().catch(() => 0);
  const db = getDb();
  const { totalTokens, batchSize } = ADMIN_CETUIA_SEED_PROBE;

  for (let start = 1; start <= totalTokens; start += batchSize) {
    const end = Math.min(totalTokens, start + batchSize - 1);
    const values = Array.from({ length: end - start + 1 }, (_, i) => ({ id: start + i }));
    await db.insert(schema.cetuiaTokens).values(values).onConflictDoNothing();
  }

  const after = await countTokens().catch(() => before);
  await writeAdminAudit(req, ctx, ADMIN_CETUIA_SEED_PROBE.auditAction, 'cetuia_tokens', 'all', {
    before,
    after,
    total: totalTokens,
  });

  return corsJson(req, 200, { ok: true, before, after, total: totalTokens });
}