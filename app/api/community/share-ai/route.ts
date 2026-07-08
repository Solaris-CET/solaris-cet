import { eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import {
  COMMUNITY_SHARE_AI_PROBE,
  communityShareAiDedupeKey,
  parseCommunityShareAiContext,
} from '../../lib/communityShareAi';
import { corsJson, optionsResponse, readJson } from '@/api/lib/http';
import { ensureAllowedOrigin } from '@/api/lib/originGuard';
import { withRateLimit } from '@/api/lib/rateLimit';
import { awardPoints } from '@/api/lib/points';
import { verifyTelegramInitData } from '../../telegram/initData';

export { COMMUNITY_SHARE_AI_PATH, COMMUNITY_SHARE_AI_PROBE } from '@/api/lib/communityShareAi';

export const config = { runtime: 'nodejs' };

function envTelegramBotToken(): string {
  return String(process.env.TELEGRAM_BOT_TOKEN ?? '').trim();
}

function todayKeyUtc(now = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

export default async function handler(req: Request): Promise<Response> {
  const guard = ensureAllowedOrigin(req);
  if (guard instanceof Response) return guard;

  if (req.method === 'OPTIONS') {
    return optionsResponse(req, COMMUNITY_SHARE_AI_PROBE.methods.join(', '), `Content-Type, ${COMMUNITY_SHARE_AI_PROBE.telegramInitHeader}`);
  }
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const limited = await withRateLimit(req, guard.allowedOrigin, {
    keyPrefix: COMMUNITY_SHARE_AI_PROBE.rateLimitKey,
    limit: COMMUNITY_SHARE_AI_PROBE.rateLimit,
    windowSeconds: COMMUNITY_SHARE_AI_PROBE.rateWindowSeconds,
  });
  if (limited) return limited;

  const initData = String(req.headers.get('x-telegram-init-data') ?? '').trim();
  if (!initData) return corsJson(req, 401, { error: COMMUNITY_SHARE_AI_PROBE.missingInitDataError });

  const verified = verifyTelegramInitData(initData, envTelegramBotToken());
  if (!verified.ok) return corsJson(req, 401, { error: COMMUNITY_SHARE_AI_PROBE.invalidInitDataError, code: verified.error });

  const tgId = verified.user?.id;
  if (!tgId) return corsJson(req, 401, { error: COMMUNITY_SHARE_AI_PROBE.missingTelegramUserError });

  const db = getDb();
  const [link] = await db.select().from(schema.telegramLinks).where(eq(schema.telegramLinks.chatId, String(tgId))).limit(1);
  if (!link) return corsJson(req, 401, { error: COMMUNITY_SHARE_AI_PROBE.notLinkedError, notLinked: true });

  const context = await readJson(req)
    .then((body) => parseCommunityShareAiContext(body))
    .catch(() => COMMUNITY_SHARE_AI_PROBE.defaultContext);

  const day = todayKeyUtc();
  const { awarded } = await awardPoints(db, link.userId, COMMUNITY_SHARE_AI_PROBE.sharePoints, 'share', {
    dedupeKey: communityShareAiDedupeKey(day),
    meta: { day, platform: 'telegram', activity: 'ai_share', context },
  });

  return corsJson(req, 200, { ok: true, duplicated: !awarded });
}