import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '../../../../db/client';
import { requireUser } from '../../../lib/authUser';
import { corsJson, corsOptions, readJson } from '../../../lib/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const user = await requireUser(req);
  if (!user) return corsJson(req, 401, { error: 'Unauthorized' });

  const body = await readJson(req).catch(() => null);
  const badgeSlug = typeof (body as { badgeSlug?: unknown })?.badgeSlug === 'string' ? (body as { badgeSlug: string }).badgeSlug.trim() : '';
  if (!badgeSlug) return corsJson(req, 400, { error: 'Invalid badge' });

  const db = getDb();
  const [badge] = await db
    .select({ id: schema.badges.id, slug: schema.badges.slug, tonMetadataUri: schema.badges.tonMetadataUri })
    .from(schema.badges)
    .where(and(eq(schema.badges.slug, badgeSlug), eq(schema.badges.active, true)))
    .limit(1);
  if (!badge) return corsJson(req, 404, { error: 'Badge not found' });

  const [owned] = await db
    .select({ id: schema.userBadges.id })
    .from(schema.userBadges)
    .where(and(eq(schema.userBadges.userId, user.id), eq(schema.userBadges.badgeId, badge.id)))
    .limit(1);
  if (!owned?.id) return corsJson(req, 409, { error: 'Not eligible' });

  await db.insert(schema.nftBadgeClaims).values({ userId: user.id, badgeId: badge.id, status: 'requested', meta: { badgeSlug, tonMetadataUri: badge.tonMetadataUri ?? null } }).onConflictDoNothing();

  const [claim] = await db
    .select({ status: schema.nftBadgeClaims.status, requestedAt: schema.nftBadgeClaims.requestedAt, mintedAt: schema.nftBadgeClaims.mintedAt, txHash: schema.nftBadgeClaims.txHash, nftAddress: schema.nftBadgeClaims.nftAddress })
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

