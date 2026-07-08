import { eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import {
  CMS_MEDIA_PROBE,
  decodeCmsMediaBase64,
  parseCmsMediaId,
} from '../lib/cmsMedia';
import { corsOptions } from '@/api/lib/http';

export { CMS_MEDIA_PATH, CMS_MEDIA_PROBE } from '@/api/lib/cmsMedia';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, CMS_MEDIA_PROBE.methods.join(', '));
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405 });

  const id = parseCmsMediaId(new URL(req.url));
  if (!id) return new Response(CMS_MEDIA_PROBE.missingIdError, { status: 400 });

  const db = getDb();
  const [asset] = await db.select().from(schema.cmsAssets).where(eq(schema.cmsAssets.id, id));
  if (!asset) return new Response(CMS_MEDIA_PROBE.notFoundError, { status: 404 });

  const bytes = decodeCmsMediaBase64(asset.dataBase64);
  return new Response(bytes as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': asset.mimeType,
      'Cache-Control': CMS_MEDIA_PROBE.cacheControl,
    },
  });
}