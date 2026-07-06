import { and, desc, eq, ilike } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { writeAdminAudit } from '../../lib/adminAudit';
import { requireAdminAuth, requireAdminRole } from '../../lib/adminAuth';
import { corsJson, corsOptions } from '../../lib/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, DELETE, OPTIONS');
  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  const db = getDb();

  if (req.method === 'GET') {
    const ok = requireAdminRole(ctx, 'viewer');
    if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });
    const url = new URL(req.url);
    const q = (url.searchParams.get('q') ?? '').trim();
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
      .limit(300);
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
    const ok = requireAdminRole(ctx, 'admin');
    if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });
    const url = new URL(req.url);
    const id = (url.searchParams.get('id') ?? '').trim();
    if (!id) return corsJson(req, 400, { error: 'Missing id' });
    const [existing] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    if (!existing) return corsJson(req, 404, { error: 'Not found' });
    await db.delete(schema.users).where(eq(schema.users.id, id));
    await writeAdminAudit(req, ctx, 'USER_DELETED', 'user', id, { walletAddress: existing.walletAddress });
    return corsJson(req, 200, { ok: true });
  }

  return corsJson(req, 405, { error: 'Method not allowed' });
}

