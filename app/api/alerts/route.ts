import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireUser } from '@/api/lib/authUser';
import {
  ALERTS_PROBE,
  parseAlertDeleteId,
  parseAlertPostBody,
} from '../lib/alerts';
import { getAllowedOrigin } from '@/api/lib/cors';
import { corsJson, corsOptions, readJson } from '@/api/lib/http';

export { ALERTS_PATH, ALERTS_PROBE } from '@/api/lib/alerts';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, POST, DELETE, OPTIONS');

  const user = await requireUser(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: ALERTS_PROBE.unauthenticatedStatus,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }

  const db = getDb();

  if (req.method === 'GET') {
    const rows = await db.select().from(schema.priceAlerts).where(eq(schema.priceAlerts.userId, user.id));
    return corsJson(req, 200, {
      ok: true,
      alerts: rows.map((r) => ({
        id: r.id,
        asset: r.asset,
        direction: r.direction,
        targetUsd: String(r.targetUsd),
        channel: r.channel,
        cooldownMinutes: r.cooldownMinutes,
        lastSentAt: r.lastSentAt ? r.lastSentAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  }

  if (req.method === 'DELETE') {
    const id = parseAlertDeleteId(new URL(req.url).searchParams);
    if (!id) return corsJson(req, 400, { error: ALERTS_PROBE.missingIdError });
    await db.delete(schema.priceAlerts).where(and(eq(schema.priceAlerts.id, id), eq(schema.priceAlerts.userId, user.id)));
    return corsJson(req, 200, { ok: true });
  }

  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return corsJson(req, 400, { error: 'Invalid JSON' });
  }

  const parsed = parseAlertPostBody(body);
  if (!parsed) return corsJson(req, 400, { error: ALERTS_PROBE.invalidInputError });
  const { id, asset, direction, targetUsd, channel, cooldownMinutes } = parsed;

  if (id) {
    const updated = await db
      .update(schema.priceAlerts)
      .set({ asset, direction, targetUsd, channel, cooldownMinutes })
      .where(and(eq(schema.priceAlerts.id, id), eq(schema.priceAlerts.userId, user.id)))
      .returning();
    const row = updated[0];
    if (!row) return corsJson(req, 404, { error: ALERTS_PROBE.notFoundError });
    return corsJson(req, 200, { ok: true, alert: { id: row.id } });
  }

  const inserted = await db
    .insert(schema.priceAlerts)
    .values({ userId: user.id, asset, direction, targetUsd, channel, cooldownMinutes })
    .returning();
  const row = inserted[0];
  return corsJson(req, 201, { ok: true, alert: { id: row.id } });
}