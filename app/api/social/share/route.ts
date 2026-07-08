import { getDb, schema } from '@/db/client';
import { requireAuth } from '@/api/lib/auth';
import { getAllowedOrigin } from '@/api/lib/cors';
import { jsonResponse, optionsResponse } from '@/api/lib/http';
import { ensureAllowedOrigin } from '@/api/lib/originGuard';
import { awardPoints } from '@/api/lib/points';
import { withRateLimit } from '@/api/lib/rateLimit';
import {
  buildSocialShareDedupeKey,
  parseSocialShareBody,
  SOCIAL_SHARE_PROBE,
  socialShareDayKey,
} from '../../lib/socialShare';

export { SOCIAL_SHARE_PATH, SOCIAL_SHARE_PROBE } from '@/api/lib/socialShare';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const guard = ensureAllowedOrigin(req);
  if (guard instanceof Response) return guard;

  if (req.method === 'OPTIONS') {
    return optionsResponse(req, SOCIAL_SHARE_PROBE.methods.join(', '), 'Content-Type, Authorization');
  }
  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  }

  const allowedOrigin = getAllowedOrigin(req.headers.get('origin'));
  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: SOCIAL_SHARE_PROBE.rateLimitKey,
    limit: SOCIAL_SHARE_PROBE.rateLimit,
    windowSeconds: SOCIAL_SHARE_PROBE.rateWindowSeconds,
  });
  if (limited) return limited;

  const ctx = await requireAuth(req);
  if ('error' in ctx) return jsonResponse(req, { error: ctx.error }, ctx.status);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: SOCIAL_SHARE_PROBE.invalidJsonError }, 400);
  }

  const parsed = parseSocialShareBody(body);
  if (!parsed) return jsonResponse(req, { error: SOCIAL_SHARE_PROBE.invalidRequestError }, 400);

  const day = socialShareDayKey();
  const db = getDb();

  try {
    await db.insert(schema.shareEvents).values({ userId: ctx.user.id, platform: parsed.platform, url: parsed.url, day });
  } catch {
    return jsonResponse(req, { ok: true, awarded: false });
  }

  const { awarded } = await awardPoints(db, ctx.user.id, SOCIAL_SHARE_PROBE.sharePoints, SOCIAL_SHARE_PROBE.shareReason, {
    dedupeKey: buildSocialShareDedupeKey(day, parsed.platform, parsed.url),
    meta: { platform: parsed.platform, url: parsed.url, day, activity: 'social_share' },
  });
  return jsonResponse(req, { ok: true, awarded });
}