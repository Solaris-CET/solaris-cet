import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireAuth } from '@/api/lib/auth';
import {
  EVENT_RSVP_PROBE,
  eventRsvpDedupeKey,
  isEventRsvpCancel,
  parseEventRsvpPostBody,
} from '../../lib/eventRsvp';
import { jsonResponse, optionsResponse } from '@/api/lib/http';
import { ensureAllowedOrigin } from '@/api/lib/originGuard';
import { awardPoints } from '@/api/lib/points';

export { EVENT_RSVP_PATH, EVENT_RSVP_PROBE } from '@/api/lib/eventRsvp';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const guard = ensureAllowedOrigin(req);
  if (guard instanceof Response) return guard;

  if (req.method === 'OPTIONS') {
    return optionsResponse(req, EVENT_RSVP_PROBE.methods.join(', '), 'Content-Type, Authorization');
  }
  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  }

  const ctx = await requireAuth(req);
  if ('error' in ctx) return jsonResponse(req, { error: ctx.error }, ctx.status);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: EVENT_RSVP_PROBE.invalidJsonError }, 400);
  }

  const parsed = parseEventRsvpPostBody(body);
  if (!parsed.eventId) return jsonResponse(req, { error: EVENT_RSVP_PROBE.invalidEventError }, 400);

  const db = getDb();
  if (isEventRsvpCancel(parsed.status)) {
    await db
      .delete(schema.eventRsvps)
      .where(and(eq(schema.eventRsvps.eventId, parsed.eventId), eq(schema.eventRsvps.userId, ctx.user.id)));
    return jsonResponse(req, { ok: true, status: EVENT_RSVP_PROBE.cancelStatus });
  }

  await db
    .insert(schema.eventRsvps)
    .values({ eventId: parsed.eventId, userId: ctx.user.id, status: EVENT_RSVP_PROBE.defaultStatus })
    .onConflictDoUpdate({
      target: [schema.eventRsvps.eventId, schema.eventRsvps.userId],
      set: { status: EVENT_RSVP_PROBE.defaultStatus },
    });

  const day = new Date().toISOString().slice(0, 10);
  await awardPoints(db, ctx.user.id, EVENT_RSVP_PROBE.rsvpPoints, 'rsvp', {
    dedupeKey: eventRsvpDedupeKey(parsed.eventId),
    meta: { activity: 'rsvp', day, eventId: parsed.eventId },
  });
  return jsonResponse(req, { ok: true, status: EVENT_RSVP_PROBE.defaultStatus });
}