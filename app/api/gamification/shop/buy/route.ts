import { and, eq, sql } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireUser } from '@/api/lib/authUser';
import { corsJson, corsOptions, readJson } from '@/api/lib/http';
import { isShopBuyUniqueViolation, parseShopBuyItemSlug, SHOP_BUY_PROBE } from '@/api/lib/shopBuy';
import { bootstrapGamification } from '@/api/gamification/lib/gamification';

export { SHOP_BUY_PATH, SHOP_BUY_PROBE } from '@/api/lib/shopBuy';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, SHOP_BUY_PROBE.methods.join(', '));
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const user = await requireUser(req);
  if (!user) return corsJson(req, SHOP_BUY_PROBE.unauthenticatedStatus, { error: 'Unauthorized' });

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return corsJson(req, 400, { error: SHOP_BUY_PROBE.invalidJsonError });
  }

  const itemSlug = parseShopBuyItemSlug(body);
  if (!itemSlug) return corsJson(req, 400, { error: SHOP_BUY_PROBE.invalidItemError });

  const db = getDb();
  await bootstrapGamification(db);

  let out:
    | { ok: false; status: number; error: string }
    | { ok: true; purchased: boolean; alreadyOwned: boolean; cost: number; points?: number | null };
  try {
    out = await db.transaction(async (tx) => {
      const [item] = await tx
        .select({ id: schema.shopItems.id, slug: schema.shopItems.slug, cost: schema.shopItems.costPoints, active: schema.shopItems.active })
        .from(schema.shopItems)
        .where(eq(schema.shopItems.slug, itemSlug))
        .limit(1);
      if (!item || !item.active) return { ok: false as const, status: 404 as const, error: SHOP_BUY_PROBE.notFoundError };
      const cost = item.cost ?? 0;
      if (cost <= 0) return { ok: false as const, status: 400 as const, error: SHOP_BUY_PROBE.invalidCostError };

      const [owned] = await tx
        .select({ id: schema.userInventory.id })
        .from(schema.userInventory)
        .where(and(eq(schema.userInventory.userId, user.id), eq(schema.userInventory.itemId, item.id)))
        .limit(1);
      if (owned?.id) return { ok: true as const, purchased: false, alreadyOwned: true, cost };

      try {
        await tx.insert(schema.pointsLedger).values({
          userId: user.id,
          delta: -cost,
          reason: SHOP_BUY_PROBE.shopReason,
          dedupeKey: `shop:${item.id}`,
          meta: { item: item.slug, cost },
        });
      } catch (err) {
        if (!isShopBuyUniqueViolation(err)) throw err;
        return { ok: true as const, purchased: false, alreadyOwned: true, cost };
      }

      const updated = await tx
        .update(schema.users)
        .set({ points: sql`${schema.users.points} - ${cost}` })
        .where(and(eq(schema.users.id, user.id), sql`${schema.users.points} >= ${cost}`))
        .returning({ points: schema.users.points });
      if (updated.length === 0) {
        throw new Error('insufficient_points');
      }

      await tx.insert(schema.userInventory).values({ userId: user.id, itemId: item.id, equipped: false });
      return { ok: true as const, purchased: true, alreadyOwned: false, cost, points: updated[0]?.points ?? null };
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'insufficient_points') return corsJson(req, 409, { error: SHOP_BUY_PROBE.insufficientPointsError });
    throw err;
  }

  if (!out.ok) return corsJson(req, out.status, { error: out.error });
  return corsJson(req, 200, out);
}