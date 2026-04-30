import { desc } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { requireAdminAuth, requireAdminRole } from '../../lib/adminAuth';
import { getAllowedOrigin } from '../../lib/cors';
import { corsJson, corsOptions } from '../../lib/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (origin && allowedOrigin !== origin) return corsJson(req, 403, { error: 'Forbidden' });
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const ok = requireAdminRole(ctx, 'viewer');
  if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });

  const db = getDb();
  const rows = await db.select().from(schema.contacts).orderBy(desc(schema.contacts.createdAt)).limit(200);
  return corsJson(req, 200, {
    ok: true,
    leads: rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      userId: r.userId,
      email: r.email,
      name: r.name,
    })),
  });
}
