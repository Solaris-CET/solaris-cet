import { desc, eq } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { requireUser } from '../../lib/authUser';
import { corsJson, corsOptions } from '../../lib/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const user = await requireUser(req);
  if (!user) return corsJson(req, 401, { error: 'Unauthorized' });

  const db = getDb();
  const invites = await db
    .select({
      id: schema.userInvites.id,
      usedCount: schema.userInvites.usedCount,
      maxUses: schema.userInvites.maxUses,
      expiresAt: schema.userInvites.expiresAt,
      revokedAt: schema.userInvites.revokedAt,
      createdAt: schema.userInvites.createdAt,
    })
    .from(schema.userInvites)
    .where(eq(schema.userInvites.createdByUserId, user.id))
    .orderBy(desc(schema.userInvites.createdAt))
    .limit(50);

  return corsJson(req, 200, {
    ok: true,
    invites: invites.map((i) => ({
      id: i.id,
      usedCount: i.usedCount,
      maxUses: i.maxUses,
      expiresAt: i.expiresAt?.toISOString() ?? null,
      revokedAt: i.revokedAt?.toISOString() ?? null,
      createdAt: i.createdAt.toISOString(),
    })),
  });
}

