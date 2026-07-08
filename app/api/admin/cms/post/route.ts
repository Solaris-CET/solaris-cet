import { eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { ADMIN_CMS_POST_PROBE, parseCmsPostId } from '@/api/lib/adminCmsPost';
import { guardAdminRoute } from '@/api/lib/adminAuth';
import { corsJson, corsOptions } from '@/api/lib/http';

export { ADMIN_CMS_POST_PATH, ADMIN_CMS_POST_PROBE } from '@/api/lib/adminCmsPost';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });
  const ctx = await guardAdminRoute(req, { minRole: ADMIN_CMS_POST_PROBE.minRole });
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  const id = parseCmsPostId(new URL(req.url).searchParams);
  if (!id) return corsJson(req, 400, { error: ADMIN_CMS_POST_PROBE.missingIdError });
  const db = getDb();
  const [post] = await db.select().from(schema.cmsPosts).where(eq(schema.cmsPosts.id, id));
  if (!post) return corsJson(req, 404, { error: ADMIN_CMS_POST_PROBE.notFoundError });
  return corsJson(req, 200, { post });
}