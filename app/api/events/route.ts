import { asc, gt } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { eventsUpcomingCutoff, EVENTS_PROBE } from '@/api/lib/events';
import { jsonResponse, optionsResponse } from '@/api/lib/http';

export { EVENTS_PATH, EVENTS_PROBE } from '@/api/lib/events';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req, EVENTS_PROBE.methods.join(', '), 'Content-Type');
  }
  if (req.method !== 'GET') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  }

  const db = getDb();
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
    .where(gt(schema.events.startAt, eventsUpcomingCutoff()))
    .orderBy(asc(schema.events.startAt))
    .limit(EVENTS_PROBE.listLimit);

  return jsonResponse(req, { events });
}