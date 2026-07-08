import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireUser } from '@/api/lib/authUser';
import { corsJson, corsOptions, readJson } from '@/api/lib/http';
import { parseShopEquipItemSlug, SHOP_EQUIP_PROBE } from '@/api/lib/shopEquip';

export { SHOP_EQUIP_PATH, SHOP_EQUIP_PROBE } from '@/api/lib/shopEquip';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, SHOP_EQUIP_PROBE.methods.join(', '));
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const user = await requireUser(req);
  if (!user) return corsJson(req, SHOP_EQUIP_PROBE.unauthenticatedStatus, { error: 'Unauthorized' });

  const body = await readJson(req).catch(() => null);
  const itemSlug = parseShopEquipItemSlug(body);
  if (!itemSlug) return corsJson(req, 400, { error: SHOP_EQUIP_PROBE.invalidItemError });

  const db = getDb();
  const [item] = await db
    .select({ id: schema.shopItems.id })
    .from(schema.shopItems)
    .where(and(eq(schema.shopItems.slug, itemSlug), eq(schema.shopItems.active, true)))
    .limit(1);
  if (!item) return corsJson(req, 404, { error: SHOP_EQUIP_PROBE.notFoundError });

  const [owned] = await db
    .select({ id: schema.userInventory.id })
    .from(schema.userInventory)
    .where(and(eq(schema.userInventory.userId, user.id), eq(schema.userInventory.itemId, item.id)))
    .limit(1);
  if (!owned?.id) return corsJson(req, 409, { error: SHOP_EQUIP_PROBE.notOwnedError });

  await db.transaction(async (tx) => {
    await tx
      .update(schema.userInventory)
      .set({ equipped: false })
      .where(and(eq(schema.userInventory.userId, user.id), eq(schema.userInventory.equipped, true)));
    await tx
      .update(schema.userInventory)
      .set({ equipped: true })
      .where(and(eq(schema.userInventory.userId, user.id), eq(schema.userInventory.itemId, item.id)));
  });

  return corsJson(req, 200, { ok: true, equipped: itemSlug });
}