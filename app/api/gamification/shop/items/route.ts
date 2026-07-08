import { asc, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { corsJson, corsOptions } from '@/api/lib/http';
import { SHOP_ITEMS_PROBE } from '@/api/lib/shopItems';
import { bootstrapGamification } from '@/api/gamification/lib/gamification';

export { SHOP_ITEMS_PATH, SHOP_ITEMS_PROBE } from '@/api/lib/shopItems';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, SHOP_ITEMS_PROBE.methods.join(', '));
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
    .limit(SHOP_ITEMS_PROBE.listLimit);

  return corsJson(req, 200, { ok: true, items: rows });
}