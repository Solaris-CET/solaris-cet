import { and, desc, eq } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { corsJson, corsOptions } from '../../lib/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });
  const url = new URL(req.url);
  const locale = (url.searchParams.get('locale') ?? 'ro').slice(0, 5);
  const db = getDb();
  const posts = await db
    .select({
      id: schema.cmsPosts.id,
      slug: schema.cmsPosts.slug,
      title: schema.cmsPosts.title,
      excerpt: schema.cmsPosts.excerpt,
      locale: schema.cmsPosts.locale,
      publishedAt: schema.cmsPosts.publishedAt,
      updatedAt: schema.cmsPosts.updatedAt,
    })
    .from(schema.cmsPosts)
    .where(and(eq(schema.cmsPosts.locale, locale), eq(schema.cmsPosts.status, 'published')))
    .orderBy(desc(schema.cmsPosts.publishedAt))
    .limit(200);
  return corsJson(req, 200, { posts });
}

