import { and, asc, eq } from 'drizzle-orm';

import { getDb, schema } from '../../../../db/client';
import { requireUser } from '../../../lib/authUser';
import { corsJson, corsOptions } from '../../../lib/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const user = await requireUser(req);
  if (!user) return corsJson(req, 401, { error: 'Unauthorized' });

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
    .limit(200);

  return corsJson(req, 200, { ok: true, inventory: rows.map((r) => ({ ...r, acquiredAt: r.acquiredAt.toISOString() })) });
}

