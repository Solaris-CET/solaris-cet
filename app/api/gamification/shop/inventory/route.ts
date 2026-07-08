import { and, asc, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireUser } from '@/api/lib/authUser';
import { corsJson, corsOptions } from '@/api/lib/http';
import { SHOP_INVENTORY_PROBE } from '@/api/lib/shopInventory';

export { SHOP_INVENTORY_PATH, SHOP_INVENTORY_PROBE } from '@/api/lib/shopInventory';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, SHOP_INVENTORY_PROBE.methods.join(', '));
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const user = await requireUser(req);
  if (!user) return corsJson(req, SHOP_INVENTORY_PROBE.unauthenticatedStatus, { error: 'Unauthorized' });

  const db = getDb();
  const rows = await db
    .select({
      slug: schema.shopItems.slug,
      title: schema.shopItems.title,
      description: schema.shopItems.description,
      kind: schema.shopItems.kind,
      meta: schema.shopItems.meta,
      equipped: schema.userInventory.equipped,
      acquiredAt: schema.userInventory.acquiredAt,
    })
    .from(schema.userInventory)
    .innerJoin(schema.shopItems, eq(schema.userInventory.itemId, schema.shopItems.id))
    .where(and(eq(schema.userInventory.userId, user.id), eq(schema.shopItems.active, true)))
    .orderBy(asc(schema.shopItems.kind), asc(schema.shopItems.title))
    .limit(SHOP_INVENTORY_PROBE.listLimit);

  return corsJson(req, 200, { ok: true, inventory: rows.map((r) => ({ ...r, acquiredAt: r.acquiredAt.toISOString() })) });
}