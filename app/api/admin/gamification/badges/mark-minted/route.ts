import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '../../../../../db/client';
import { writeAdminAudit } from '../../../../lib/adminAudit';
import { requireAdminAuth, requireAdminRole } from '../../../../lib/adminAuth';
import { getAllowedOrigin } from '../../../../lib/cors';
import { corsJson, corsOptions, readJson } from '../../../../lib/http';
import { withRateLimit } from '../../../../lib/rateLimit';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');

  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (origin && allowedOrigin !== origin) return corsJson(req, 403, { error: 'Forbidden' });

  const limited = await withRateLimit(req, allowedOrigin, { keyPrefix: 'admin-badge-mint', limit: 60, windowSeconds: 60 });
  if (limited) return limited;

  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const okRole = requireAdminRole(ctx, 'editor');
  if (!okRole.ok) return corsJson(req, okRole.status, { error: okRole.error });

  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const body = await readJson(req).catch(() => null);
  const userId = typeof (body as { userId?: unknown })?.userId === 'string' ? (body as { userId: string }).userId.trim() : '';
  const badgeSlug = typeof (body as { badgeSlug?: unknown })?.badgeSlug === 'string' ? (body as { badgeSlug: string }).badgeSlug.trim() : '';
  const txHash = typeof (body as { txHash?: unknown })?.txHash === 'string' ? (body as { txHash: string }).txHash.trim().slice(0, 200) : '';
  const nftAddress = typeof (body as { nftAddress?: unknown })?.nftAddress === 'string' ? (body as { nftAddress: string }).nftAddress.trim().slice(0, 120) : '';
  if (!userId || !badgeSlug) return corsJson(req, 400, { error: 'Invalid request' });

  const db = getDb();
  const [badge] = await db.select({ id: schema.badges.id }).from(schema.badges).where(and(eq(schema.badges.slug, badgeSlug), eq(schema.badges.active, true))).limit(1);
  if (!badge) return corsJson(req, 404, { error: 'Badge not found' });

  await db
    .update(schema.nftBadgeClaims)
    .set({ status: 'minted', mintedAt: new Date(), txHash: txHash || null, nftAddress: nftAddress || null })
    .where(and(eq(schema.nftBadgeClaims.userId, userId), eq(schema.nftBadgeClaims.badgeId, badge.id)));

  await writeAdminAudit(req, ctx, 'BADGE_MARK_MINTED', 'nft_badge_claim', `${userId}:${badge.id}`, {
    userId,
    badgeSlug,
    txHash: txHash || null,
    nftAddress: nftAddress || null,
  });

  return corsJson(req, 200, { ok: true });
}
