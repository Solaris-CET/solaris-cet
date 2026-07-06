import { getDb, schema } from '../../../db/client';
import { requireAuth } from '../../lib/auth';
import { clientIp } from '../../lib/clientIp';
import { getAllowedOrigin } from '../../lib/cors';
import { corsJson, corsOptions, readJson } from '../../lib/http';
import { sha256Hex } from '../../lib/nodeCrypto';
import { withRateLimit } from '../../lib/rateLimit';

export const config = { runtime: 'nodejs' };

function dayKeyUtc(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

type IncomingEvent = {
  name: string;
  anonId: string;
  sessionId: string;
  ts?: number;
  props?: unknown;
  pagePath?: unknown;
  referrer?: unknown;
};

function parseIncomingEvent(raw: unknown): IncomingEvent | null {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  const name = typeof rec.name === 'string' ? rec.name.trim() : '';
  const anonId = typeof rec.anonId === 'string' ? rec.anonId.trim() : '';
  const sessionId = typeof rec.sessionId === 'string' ? rec.sessionId.trim() : '';
  const ts = typeof rec.ts === 'number' && Number.isFinite(rec.ts) ? rec.ts : undefined;
  if (!name || name.length > 80) return null;
  if (!anonId || anonId.length > 120) return null;
  if (!sessionId || sessionId.length > 140) return null;
  const props = rec.props;
  const pagePath = rec.pagePath;
  const referrer = rec.referrer;
  return { name, anonId, sessionId, ts, props, pagePath, referrer };
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const rl = await withRateLimit(req, allowedOrigin, {
    keyPrefix: 'analytics_track',
    limit: 240,
    windowSeconds: 60,
  });
  if (rl) return rl;

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return corsJson(req, 400, { error: 'Invalid JSON' });
  }

  const rawEvents = (body as { events?: unknown }).events;
  const list = Array.isArray(rawEvents) ? rawEvents : [body];
  if (list.length === 0) return corsJson(req, 400, { error: 'Missing events' });
  if (list.length > 50) return corsJson(req, 400, { error: 'Too many events' });

  const parsed: IncomingEvent[] = [];
  for (const item of list) {
    const e = parseIncomingEvent(item);
    if (e) parsed.push(e);
  }
  if (parsed.length === 0) return corsJson(req, 400, { error: 'No valid events' });

  const ctx = await requireAuth(req);
  const userId = 'error' in ctx ? null : ctx.user.id;

  const now = new Date();
  const salt = String(process.env.ANALYTICS_IP_SALT ?? '').trim();
  const ip = clientIp(req);
  const ipHash = salt && ip ? sha256Hex(`${salt}|${ip}`) : null;
  const ua = req.headers.get('user-agent')?.trim() ?? '';
  const uaHash = ua ? sha256Hex(ua).slice(0, 48) : null;

  const db = getDb();
  await db.insert(schema.analyticsEvents).values(
    parsed.map((e) => {
      const createdAt = e.ts ? new Date(e.ts) : now;
      const pagePath = typeof e.pagePath === 'string' ? e.pagePath.trim().slice(0, 500) : null;
      const referrer = typeof e.referrer === 'string' ? e.referrer.trim().slice(0, 800) : null;
      const props = e.props && typeof e.props === 'object' ? (e.props as Record<string, unknown>) : null;
      return {
        userId,
        anonId: e.anonId,
        sessionId: e.sessionId,
        name: e.name,
        props,
        pagePath,
        referrer,
        uaHash,
        ipHash,
        day: dayKeyUtc(createdAt),
        createdAt,
      };
    }),
  );

  return corsJson(req, 201, { ok: true, ingested: parsed.length });
}
