import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { corsJson, corsOptions } from '../../lib/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });
  const url = new URL(req.url);
  const locale = (url.searchParams.get('locale') ?? 'ro').slice(0, 5);
  const slug = (url.searchParams.get('slug') ?? '').trim().toLowerCase();
  if (!slug) return corsJson(req, 400, { error: 'Missing slug' });
  const db = getDb();
  const [post] = await db
    .select({
      id: schema.cmsPosts.id,
      slug: schema.cmsPosts.slug,
      title: schema.cmsPosts.title,
      excerpt: schema.cmsPosts.excerpt,
      locale: schema.cmsPosts.locale,
      markdown: schema.cmsPosts.markdown,
      coverAssetId: schema.cmsPosts.coverAssetId,
      publishedAt: schema.cmsPosts.publishedAt,
      updatedAt: schema.cmsPosts.updatedAt,
    })
    .from(schema.cmsPosts)
    .where(and(eq(schema.cmsPosts.locale, locale), eq(schema.cmsPosts.slug, slug), eq(schema.cmsPosts.status, 'published')));
  if (!post) return corsJson(req, 404, { error: 'Not found' });
  return corsJson(req, 200, { post });
}

