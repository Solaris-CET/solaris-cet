import { eq } from 'drizzle-orm';

import { getDb, schema } from '../../../../db/client';
import { requireAdminAuth, requireAdminRole } from '../../../lib/adminAuth';
import { corsJson, corsOptions } from '../../../lib/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });
  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const ok = requireAdminRole(ctx, 'viewer');
  if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });

  const url = new URL(req.url);
  const id = (url.searchParams.get('id') ?? '').trim();
  if (!id) return corsJson(req, 400, { error: 'Missing id' });
  const db = getDb();
  const [post] = await db.select().from(schema.cmsPosts).where(eq(schema.cmsPosts.id, id));
  if (!post) return corsJson(req, 404, { error: 'Not found' });
  return corsJson(req, 200, { post });
}

