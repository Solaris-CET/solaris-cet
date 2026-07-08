import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireUser } from '@/api/lib/authUser';
import { BADGE_CLAIM_NFT_PROBE, parseBadgeClaimSlug } from '@/api/lib/badgeClaimNft';
import { corsJson, corsOptions, readJson } from '@/api/lib/http';

export { BADGE_CLAIM_NFT_PATH, BADGE_CLAIM_NFT_PROBE } from '@/api/lib/badgeClaimNft';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, BADGE_CLAIM_NFT_PROBE.methods.join(', '));
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const user = await requireUser(req);
  if (!user) return corsJson(req, BADGE_CLAIM_NFT_PROBE.unauthenticatedStatus, { error: 'Unauthorized' });

  const body = await readJson(req).catch(() => null);
  const badgeSlug = parseBadgeClaimSlug(body);
  if (!badgeSlug) return corsJson(req, 400, { error: BADGE_CLAIM_NFT_PROBE.invalidBadgeError });

  const db = getDb();
  const [badge] = await db
    .select({ id: schema.badges.id, slug: schema.badges.slug, tonMetadataUri: schema.badges.tonMetadataUri })
    .from(schema.badges)
    .where(and(eq(schema.badges.slug, badgeSlug), eq(schema.badges.active, true)))
    .limit(1);
  if (!badge) return corsJson(req, 404, { error: BADGE_CLAIM_NFT_PROBE.notFoundError });

  const [owned] = await db
    .select({ id: schema.userBadges.id })
    .from(schema.userBadges)
    .where(and(eq(schema.userBadges.userId, user.id), eq(schema.userBadges.badgeId, badge.id)))
    .limit(1);
  if (!owned?.id) return corsJson(req, 409, { error: BADGE_CLAIM_NFT_PROBE.notEligibleError });

  await db
    .insert(schema.nftBadgeClaims)
    .values({ userId: user.id, badgeId: badge.id, status: 'requested', meta: { badgeSlug, tonMetadataUri: badge.tonMetadataUri ?? null } })
    .onConflictDoNothing();

  const [claim] = await db
    .select({
      status: schema.nftBadgeClaims.status,
      requestedAt: schema.nftBadgeClaims.requestedAt,
      mintedAt: schema.nftBadgeClaims.mintedAt,
      txHash: schema.nftBadgeClaims.txHash,
      nftAddress: schema.nftBadgeClaims.nftAddress,
    })
    .from(schema.nftBadgeClaims)
    .where(and(eq(schema.nftBadgeClaims.userId, user.id), eq(schema.nftBadgeClaims.badgeId, badge.id)))
    .limit(1);

  return corsJson(req, 200, {
    ok: true,
    claim: claim
      ? {
          status: claim.status,
          requestedAt: claim.requestedAt.toISOString(),
          mintedAt: claim.mintedAt?.toISOString() ?? null,
          txHash: claim.txHash ?? null,
          nftAddress: claim.nftAddress ?? null,
        }
      : null,
  });
}