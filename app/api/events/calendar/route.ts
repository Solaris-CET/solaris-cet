import { asc } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import {
  buildEventsIcsCalendar,
  EVENTS_CALENDAR_PROBE,
  resolveEventsCalendarSiteUrl,
} from '../../lib/eventsCalendar';
import { getAllowedOrigin } from '@/api/lib/cors';
import { optionsResponse } from '@/api/lib/http';

export { EVENTS_CALENDAR_PATH, EVENTS_CALENDAR_PROBE } from '@/api/lib/eventsCalendar';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') {
    return optionsResponse(req, EVENTS_CALENDAR_PROBE.methods.join(', '), 'Content-Type');
  }
  if (req.method !== 'GET') {
    return new Response('Method not allowed', {
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        Vary: 'Origin',
      },
    });
  }

  const db = getDb();
  const events = await db
    .select({
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
    .orderBy(asc(schema.events.startAt))
    .limit(EVENTS_CALENDAR_PROBE.listLimit);

  const body = buildEventsIcsCalendar(events, resolveEventsCalendarSiteUrl());
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': EVENTS_CALENDAR_PROBE.contentType,
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
      'Content-Disposition': `inline; filename="${EVENTS_CALENDAR_PROBE.filename}"`,
    },
  });
}