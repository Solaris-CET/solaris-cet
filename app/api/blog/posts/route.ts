import { and, desc, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { BLOG_POSTS_PROBE, parseBlogPostsLocale } from '@/api/lib/blogPosts';
import { corsJson, corsOptions } from '@/api/lib/http';

export { BLOG_POSTS_PATH, BLOG_POSTS_PROBE } from '@/api/lib/blogPosts';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, BLOG_POSTS_PROBE.methods.join(', '));
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const url = new URL(req.url);
  const locale = parseBlogPostsLocale(url.searchParams);
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
    .where(and(eq(schema.cmsPosts.locale, locale), eq(schema.cmsPosts.status, BLOG_POSTS_PROBE.publishedStatus)))
    .orderBy(desc(schema.cmsPosts.publishedAt))
    .limit(BLOG_POSTS_PROBE.maxListRows);
  return corsJson(req, 200, { posts });
}