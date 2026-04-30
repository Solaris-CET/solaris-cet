import { and, eq, inArray } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { corsJson, corsOptions } from '../../lib/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });
  const url = new URL(req.url);
  const locale = (url.searchParams.get('locale') ?? 'ro').slice(0, 5);
  const keys = (url.searchParams.get('keys') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (keys.length === 0 || keys.length > 50) return corsJson(req, 400, { error: 'Missing keys' });
  const db = getDb();
  const rows = await db
    .select({ key: schema.cmsBlocks.key, format: schema.cmsBlocks.format, content: schema.cmsBlocks.content })
    .from(schema.cmsBlocks)
    .where(and(eq(schema.cmsBlocks.locale, locale), inArray(schema.cmsBlocks.key, keys)))
    .limit(200);
  const map: Record<string, { format: string; content: string }> = {};
  for (const r of rows) map[r.key] = { format: r.format, content: r.content };
  return corsJson(req, 200, { locale, blocks: map });
}

