import { asc, eq } from 'drizzle-orm';

import { getDb, schema } from '../../../../db/client';
import { corsJson, corsOptions } from '../../../lib/http';
import { bootstrapGamification } from '../../lib/gamification';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const db = getDb();
  await bootstrapGamification(db);

  const rows = await db
    .select({
      slug: schema.shopItems.slug,
      title: schema.shopItems.title,
      description: schema.shopItems.description,
      kind: schema.shopItems.kind,
      costPoints: schema.shopItems.costPoints,
      meta: schema.shopItems.meta,
    })
    .from(schema.shopItems)
    .where(eq(schema.shopItems.active, true))
    .orderBy(asc(schema.shopItems.costPoints))
    .limit(200);

  return corsJson(req, 200, { ok: true, items: rows });
}

