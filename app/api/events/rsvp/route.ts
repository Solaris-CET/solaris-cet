import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { requireAuth } from '../../lib/auth';
import { jsonResponse, optionsResponse } from '../../lib/http';
import { ensureAllowedOrigin } from '../../lib/originGuard';
import { awardPoints } from '../../lib/points';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const guard = ensureAllowedOrigin(req);
  if (guard instanceof Response) return guard;

  if (req.method === 'OPTIONS') {
    return optionsResponse(req, 'POST, OPTIONS', 'Content-Type, Authorization');
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
    return jsonResponse(req, { error: 'Invalid JSON body' }, 400);
  }

  const eventId =
    typeof body === 'object' && body !== null && 'eventId' in body && typeof (body as { eventId?: unknown }).eventId === 'string'
      ? (body as { eventId: string }).eventId.trim()
      : '';
  const status =
    typeof body === 'object' && body !== null && 'status' in body && typeof (body as { status?: unknown }).status === 'string'
      ? (body as { status: string }).status.trim()
      : 'yes';

  if (!eventId) return jsonResponse(req, { error: 'Invalid event' }, 400);

  const db = getDb();
  if (status === 'none') {
    await db
      .delete(schema.eventRsvps)
      .where(and(eq(schema.eventRsvps.eventId, eventId), eq(schema.eventRsvps.userId, ctx.user.id)));
    return jsonResponse(req, { ok: true, status: 'none' });
  }

  await db
    .insert(schema.eventRsvps)
    .values({ eventId, userId: ctx.user.id, status: 'yes' })
    .onConflictDoUpdate({
      target: [schema.eventRsvps.eventId, schema.eventRsvps.userId],
      set: { status: 'yes' },
    });

  const day = new Date().toISOString().slice(0, 10);
  await awardPoints(db, ctx.user.id, 3, 'rsvp', { dedupeKey: `rsvp:${eventId}`, meta: { activity: 'rsvp', day, eventId } });
  return jsonResponse(req, { ok: true, status: 'yes' });
}
