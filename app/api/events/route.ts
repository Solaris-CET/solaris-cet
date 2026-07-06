import { asc, gt } from 'drizzle-orm';

import { getDb, schema } from '../../db/client';
import { jsonResponse, optionsResponse } from '../lib/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req, 'GET, OPTIONS', 'Content-Type');
  }
  if (req.method !== 'GET') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  }

  const db = getDb();
  const now = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const events = await db
    .select({
      id: schema.events.id,
      slug: schema.events.slug,
      title: schema.events.title,
      description: schema.events.description,
      startAt: schema.events.startAt,
      endAt: schema.events.endAt,
      location: schema.events.location,
      joinUrl: schema.events.joinUrl,
      updatedAt: schema.events.updatedAt,
    })
    .from(schema.events)
    .where(gt(schema.events.startAt, now))
    .orderBy(asc(schema.events.startAt))
    .limit(100);

  return jsonResponse(req, { events });
}

