import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { writeAdminAudit } from '@/api/lib/adminAudit';
import { guardAdminRoute } from '@/api/lib/adminAuth';
import {
  ADMIN_GAMIFICATION_BADGE_MARK_MINTED_PROBE,
  parseBadgeMarkMintedBody,
} from '../../../../lib/adminGamificationBadgeMarkMinted';
import { getAllowedOrigin } from '@/api/lib/cors';
import { corsJson, corsOptions, readJson } from '@/api/lib/http';
import { withRateLimit } from '@/api/lib/rateLimit';

export {
  ADMIN_GAMIFICATION_BADGE_MARK_MINTED_PATH,
  ADMIN_GAMIFICATION_BADGE_MARK_MINTED_PROBE,
} from '../../../../lib/adminGamificationBadgeMarkMinted';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');

  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (origin && allowedOrigin !== origin) return corsJson(req, 403, { error: 'Forbidden' });

  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: ADMIN_GAMIFICATION_BADGE_MARK_MINTED_PROBE.rateLimitKey,
    limit: 60,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const ctx = await guardAdminRoute(req, { minRole: ADMIN_GAMIFICATION_BADGE_MARK_MINTED_PROBE.minRole });
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const parsed = parseBadgeMarkMintedBody(await readJson(req).catch(() => null));
  if (!parsed.ok) return corsJson(req, 400, { error: parsed.error });
  const { userId, badgeSlug, txHash, nftAddress } = parsed;

  const db = getDb();
  const [badge] = await db
    .select({ id: schema.badges.id })
    .from(schema.badges)
    .where(and(eq(schema.badges.slug, badgeSlug), eq(schema.badges.active, true)))
    .limit(1);
  if (!badge) return corsJson(req, 404, { error: 'Badge not found' });

  await db
    .update(schema.nftBadgeClaims)
    .set({ status: 'minted', mintedAt: new Date(), txHash: txHash || null, nftAddress: nftAddress || null })
    .where(and(eq(schema.nftBadgeClaims.userId, userId), eq(schema.nftBadgeClaims.badgeId, badge.id)));

  await writeAdminAudit(req, ctx, ADMIN_GAMIFICATION_BADGE_MARK_MINTED_PROBE.auditAction, 'nft_badge_claim', `${userId}:${badge.id}`, {
    userId,
    badgeSlug,
    txHash: txHash || null,
    nftAddress: nftAddress || null,
  });

  return corsJson(req, 200, { ok: true });
}