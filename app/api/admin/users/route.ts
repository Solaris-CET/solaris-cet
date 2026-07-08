import { and, desc, eq, ilike } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { writeAdminAudit } from '@/api/lib/adminAudit';
import { guardAdminRoute } from '@/api/lib/adminAuth';
import { ADMIN_USERS_PROBE, parseAdminUserDeleteId, parseAdminUsersQuery } from '@/api/lib/adminUsers';
import { corsJson, corsOptions } from '@/api/lib/http';

export { ADMIN_USERS_PATH, ADMIN_USERS_PROBE } from '@/api/lib/adminUsers';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, DELETE, OPTIONS');
  const ctx = await guardAdminRoute(req, { minRole: (m) => (m === 'DELETE' ? ADMIN_USERS_PROBE.deleteMinRole : ADMIN_USERS_PROBE.getMinRole) });
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  const db = getDb();

  if (req.method === 'GET') {
    const q = parseAdminUsersQuery(new URL(req.url).searchParams);
    const rows = await db
      .select({
        id: schema.users.id,
        walletAddress: schema.users.walletAddress,
        role: schema.users.role,
        points: schema.users.points,
        createdAt: schema.users.createdAt,
        displayName: schema.userSettings.displayName,
        email: schema.userSettings.email,
      })
      .from(schema.users)
      .leftJoin(schema.userSettings, eq(schema.userSettings.userId, schema.users.id))
      .where(
        q
          ? and(
              ilike(schema.users.walletAddress, `%${q}%`),
            )
          : undefined,
      )
      .orderBy(desc(schema.users.createdAt))
      .limit(ADMIN_USERS_PROBE.maxListRows);
    return corsJson(req, 200, {
      users: rows.map((r) => ({
        id: r.id,
        walletAddress: r.walletAddress,
        role: r.role,
        points: r.points,
        createdAt: r.createdAt,
        displayName: r.displayName ?? null,
        email: r.email ?? null,
      })),
    });
  }

  if (req.method === 'DELETE') {
    const id = parseAdminUserDeleteId(new URL(req.url).searchParams);
    if (!id) return corsJson(req, 400, { error: ADMIN_USERS_PROBE.missingIdError });
    const [existing] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    if (!existing) return corsJson(req, 404, { error: ADMIN_USERS_PROBE.notFoundError });
    await db.delete(schema.users).where(eq(schema.users.id, id));
    await writeAdminAudit(req, ctx, ADMIN_USERS_PROBE.auditAction, 'user', id, { walletAddress: existing.walletAddress });
    return corsJson(req, 200, { ok: true });
  }

  return corsJson(req, 405, { error: 'Method not allowed' });
}