import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '../../../../db/client';
import { requireUser } from '../../../lib/authUser';
import { corsJson, corsOptions, readJson } from '../../../lib/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const user = await requireUser(req);
  if (!user) return corsJson(req, 401, { error: 'Unauthorized' });

  const body = await readJson(req).catch(() => null);
  const itemSlug = typeof (body as { itemSlug?: unknown })?.itemSlug === 'string' ? (body as { itemSlug: string }).itemSlug.trim() : '';
  if (!itemSlug) return corsJson(req, 400, { error: 'Invalid item' });

  const db = getDb();
  const [item] = await db
    .select({ id: schema.shopItems.id })
    .from(schema.shopItems)
    .where(and(eq(schema.shopItems.slug, itemSlug), eq(schema.shopItems.active, true)))
    .limit(1);
  if (!item) return corsJson(req, 404, { error: 'Item not found' });

  const [owned] = await db
    .select({ id: schema.userInventory.id })
    .from(schema.userInventory)
    .where(and(eq(schema.userInventory.userId, user.id), eq(schema.userInventory.itemId, item.id)))
    .limit(1);
  if (!owned?.id) return corsJson(req, 409, { error: 'Not owned' });

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
