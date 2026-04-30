import { and, eq, sql } from 'drizzle-orm';

import { getDb, schema } from '../../../../db/client';
import { requireUser } from '../../../lib/authUser';
import { corsJson, corsOptions, readJson } from '../../../lib/http';
import { bootstrapGamification } from '../../lib/gamification';

export const config = { runtime: 'nodejs' };

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === '23505';
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const user = await requireUser(req);
  if (!user) return corsJson(req, 401, { error: 'Unauthorized' });

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return corsJson(req, 400, { error: 'Invalid JSON' });
  }
  const itemSlug = typeof (body as { itemSlug?: unknown })?.itemSlug === 'string' ? (body as { itemSlug: string }).itemSlug.trim() : '';
  if (!itemSlug) return corsJson(req, 400, { error: 'Invalid item' });

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
      if (!item || !item.active) return { ok: false as const, status: 404 as const, error: 'Item not found' };
      const cost = item.cost ?? 0;
      if (cost <= 0) return { ok: false as const, status: 400 as const, error: 'Invalid item cost' };

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
          reason: 'shop',
          dedupeKey: `shop:${item.id}`,
          meta: { item: item.slug, cost },
        });
      } catch (err) {
        if (!isUniqueViolation(err)) throw err;
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
    if (msg === 'insufficient_points') return corsJson(req, 409, { error: 'Insufficient points' });
    throw err;
  }

  if (!out.ok) return corsJson(req, out.status, { error: out.error });
  return corsJson(req, 200, out);
}
