import { eq } from 'drizzle-orm';

import { getDb, schema } from '../../db/client';
import { corsOptions } from '../lib/http';

export const config = { runtime: 'nodejs' };

function decodeBase64(data: string): Uint8Array {
  return new Uint8Array(Buffer.from(data, 'base64'));
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405 });
  const url = new URL(req.url);
  const id = (url.searchParams.get('id') ?? '').trim();
  if (!id) return new Response('Missing id', { status: 400 });
  const db = getDb();
  const [asset] = await db.select().from(schema.cmsAssets).where(eq(schema.cmsAssets.id, id));
  if (!asset) return new Response('Not found', { status: 404 });
  const bytes = decodeBase64(asset.dataBase64);
  return new Response(bytes, {
    status: 200,
    headers: {
      'Content-Type': asset.mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

