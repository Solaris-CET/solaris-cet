import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '../../db/client';
import { requireUser } from '../lib/authUser';
import { getAllowedOrigin } from '../lib/cors';
import { corsJson, corsOptions, readJson } from '../lib/http';

export const config = { runtime: 'nodejs' };

function parseDirection(v: unknown): 'above' | 'below' | null {
  if (v === 'above' || v === 'below') return v;
  return null;
}

function parseChannel(v: unknown): 'email' | 'push' | null {
  if (v === 'email' || v === 'push') return v;
  return null;
}

function parseAsset(v: unknown): 'CET' | 'TON' | null {
  if (v === 'CET' || v === 'TON') return v;
  return null;
}

function parseTarget(v: unknown): string | null {
  const raw = typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '';
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return raw;
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, POST, DELETE, OPTIONS');

  const user = await requireUser(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
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
    const url = new URL(req.url);
    const id = String(url.searchParams.get('id') ?? '').trim();
    if (!id) return corsJson(req, 400, { error: 'Missing id' });
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

  const id = typeof (body as { id?: unknown })?.id === 'string' ? (body as { id: string }).id.trim() : null;
  const asset = parseAsset((body as { asset?: unknown })?.asset) ?? 'CET';
  const direction = parseDirection((body as { direction?: unknown })?.direction);
  const targetUsd = parseTarget((body as { targetUsd?: unknown })?.targetUsd);
  const channel = parseChannel((body as { channel?: unknown })?.channel) ?? 'email';
  const cooldownMinutesRaw = (body as { cooldownMinutes?: unknown })?.cooldownMinutes;
  const cooldownMinutes =
    typeof cooldownMinutesRaw === 'number'
      ? Math.max(1, Math.min(24 * 60, Math.floor(cooldownMinutesRaw)))
      : 60;
  if (!direction || !targetUsd) return corsJson(req, 400, { error: 'Invalid input' });

  if (id) {
    const updated = await db
      .update(schema.priceAlerts)
      .set({ asset, direction, targetUsd, channel, cooldownMinutes })
      .where(and(eq(schema.priceAlerts.id, id), eq(schema.priceAlerts.userId, user.id)))
      .returning();
    const row = updated[0];
    if (!row) return corsJson(req, 404, { error: 'Not found' });
    return corsJson(req, 200, { ok: true, alert: { id: row.id } });
  }

  const inserted = await db
    .insert(schema.priceAlerts)
    .values({ userId: user.id, asset, direction, targetUsd, channel, cooldownMinutes })
    .returning();
  const row = inserted[0];
  return corsJson(req, 201, { ok: true, alert: { id: row.id } });
}
