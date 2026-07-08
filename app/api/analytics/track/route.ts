import { getDb, schema } from '@/db/client';
import { requireAuth } from '@/api/lib/auth';
import {
  analyticsDayKeyUtc,
  ANALYTICS_TRACK_PROBE,
  parseAnalyticsEventsBody,
} from '../../lib/analyticsTrack';
import { clientIp } from '@/api/lib/clientIp';
import { getAllowedOrigin } from '@/api/lib/cors';
import { corsJson, corsOptions, readJson } from '@/api/lib/http';
import { sha256Hex } from '@/api/lib/nodeCrypto';
import { withRateLimit } from '@/api/lib/rateLimit';

export { ANALYTICS_TRACK_PATH, ANALYTICS_TRACK_PROBE } from '@/api/lib/analyticsTrack';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const rl = await withRateLimit(req, allowedOrigin, {
    keyPrefix: ANALYTICS_TRACK_PROBE.rateLimitKey,
    limit: ANALYTICS_TRACK_PROBE.rateLimit,
    windowSeconds: ANALYTICS_TRACK_PROBE.rateWindowSeconds,
  });
  if (rl) return rl;

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return corsJson(req, 400, { error: 'Invalid JSON' });
  }

  const parsed = parseAnalyticsEventsBody(body);
  if (!parsed.ok) return corsJson(req, 400, { error: parsed.error });

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
    parsed.events.map((e) => {
      const createdAt = e.ts ? new Date(e.ts) : now;
      const pagePath = typeof e.pagePath === 'string' ? e.pagePath.trim().slice(0, ANALYTICS_TRACK_PROBE.maxPagePathLength) : null;
      const referrer = typeof e.referrer === 'string' ? e.referrer.trim().slice(0, ANALYTICS_TRACK_PROBE.maxReferrerLength) : null;
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
        day: analyticsDayKeyUtc(createdAt),
        createdAt,
      };
    }),
  );

  return corsJson(req, 201, { ok: true, ingested: parsed.events.length });
}