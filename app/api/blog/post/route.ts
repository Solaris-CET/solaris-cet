import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { BLOG_POST_PROBE, parseBlogPostLocale, parseBlogPostSlug } from '@/api/lib/blogPost';
import { corsJson, corsOptions } from '@/api/lib/http';

export { BLOG_POST_PATH, BLOG_POST_PROBE } from '@/api/lib/blogPost';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, BLOG_POST_PROBE.methods.join(', '));
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const url = new URL(req.url);
  const locale = parseBlogPostLocale(url.searchParams);
  const slug = parseBlogPostSlug(url.searchParams);
  if (!slug) return corsJson(req, 400, { error: BLOG_POST_PROBE.missingSlugError });

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
    .where(
      and(
        eq(schema.cmsPosts.locale, locale),
        eq(schema.cmsPosts.slug, slug),
        eq(schema.cmsPosts.status, BLOG_POST_PROBE.publishedStatus),
      ),
    );
  if (!post) return corsJson(req, 404, { error: BLOG_POST_PROBE.notFoundError });
  return corsJson(req, 200, { post });
}