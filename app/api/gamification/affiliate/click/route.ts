import { getDb } from '@/db/client';
import { AFFILIATE_CLICK_PROBE, parseAffiliateClickCode } from '@/api/lib/affiliateClick';
import { getAllowedOrigin } from '@/api/lib/cors';
import { corsJson, corsOptions, readJson } from '@/api/lib/http';
import { withRateLimit } from '@/api/lib/rateLimit';
import { bootstrapGamification, bumpAffiliateClick, todayKeyUtc } from '@/api/gamification/lib/gamification';

export { AFFILIATE_CLICK_PATH, AFFILIATE_CLICK_PROBE } from '@/api/lib/affiliateClick';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, AFFILIATE_CLICK_PROBE.methods.join(', '));
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const allowedOrigin = getAllowedOrigin(req.headers.get('origin'));
  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: AFFILIATE_CLICK_PROBE.rateLimitKey,
    limit: AFFILIATE_CLICK_PROBE.rateLimit,
    windowSeconds: AFFILIATE_CLICK_PROBE.rateLimitWindowSeconds,
  });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return corsJson(req, 400, { error: AFFILIATE_CLICK_PROBE.invalidJsonError });
  }

  const code = parseAffiliateClickCode(body);
  if (!code) return corsJson(req, 400, { error: AFFILIATE_CLICK_PROBE.invalidCodeError });

  const db = getDb();
  await bootstrapGamification(db);
  await bumpAffiliateClick(db, code, todayKeyUtc());
  return corsJson(req, 200, { ok: true });
}