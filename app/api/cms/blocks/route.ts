import { and, eq, inArray } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import {
  CMS_BLOCKS_PROBE,
  isValidCmsBlocksKeys,
  parseCmsBlocksKeys,
  parseCmsBlocksLocale,
} from '../../lib/cmsBlocks';
import { corsJson, corsOptions } from '@/api/lib/http';

export { CMS_BLOCKS_PATH, CMS_BLOCKS_PROBE } from '@/api/lib/cmsBlocks';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, CMS_BLOCKS_PROBE.methods.join(', '));
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const url = new URL(req.url);
  const locale = parseCmsBlocksLocale(url.searchParams);
  const keys = parseCmsBlocksKeys(url.searchParams);
  if (!isValidCmsBlocksKeys(keys)) return corsJson(req, 400, { error: CMS_BLOCKS_PROBE.missingKeysError });

  const db = getDb();
  const rows = await db
    .select({ key: schema.cmsBlocks.key, format: schema.cmsBlocks.format, content: schema.cmsBlocks.content })
    .from(schema.cmsBlocks)
    .where(and(eq(schema.cmsBlocks.locale, locale), inArray(schema.cmsBlocks.key, keys)))
    .limit(CMS_BLOCKS_PROBE.maxListRows);

  const map: Record<string, { format: string; content: string }> = {};
  for (const r of rows) map[r.key] = { format: r.format, content: r.content };
  return corsJson(req, 200, { locale, blocks: map });
}