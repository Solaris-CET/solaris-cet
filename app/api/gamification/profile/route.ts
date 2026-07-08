import { and, desc, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireUser } from '@/api/lib/authUser';
import { GAMIFICATION_PROFILE_PROBE, parseGamificationProfileWallet } from '@/api/lib/gamificationProfile';
import { corsJson, corsOptions } from '@/api/lib/http';
import { tonAddressSchema } from '@/api/lib/validation';
import { levelProgressFromXp } from '@/api/gamification/lib/gamification';

export { GAMIFICATION_PROFILE_PATH, GAMIFICATION_PROFILE_PROBE } from '@/api/lib/gamificationProfile';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, GAMIFICATION_PROFILE_PROBE.methods.join(', '));
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const viewer = await requireUser(req);
  if (!viewer) return corsJson(req, GAMIFICATION_PROFILE_PROBE.unauthenticatedStatus, { error: 'Unauthorized' });

  const url = new URL(req.url);
  const walletRaw = parseGamificationProfileWallet(url.searchParams);
  const parsed = tonAddressSchema.safeParse(walletRaw);
  if (!parsed.success) return corsJson(req, 400, { error: GAMIFICATION_PROFILE_PROBE.invalidWalletError });
  const walletAddress = parsed.data.toString();

  const db = getDb();
  const [u] = await db
    .select({ id: schema.users.id, walletAddress: schema.users.walletAddress, points: schema.users.points })
    .from(schema.users)
    .where(eq(schema.users.walletAddress, walletAddress))
    .limit(1);
  if (!u) return corsJson(req, 404, { error: GAMIFICATION_PROFILE_PROBE.notFoundError });

  const badges = await db
    .select({
      slug: schema.badges.slug,
      title: schema.badges.title,
      rarity: schema.badges.rarity,
      awardedAt: schema.userBadges.awardedAt,
    })
    .from(schema.userBadges)
    .innerJoin(schema.badges, eq(schema.userBadges.badgeId, schema.badges.id))
    .where(and(eq(schema.userBadges.userId, u.id), eq(schema.badges.active, true)))
    .orderBy(desc(schema.userBadges.awardedAt))
    .limit(GAMIFICATION_PROFILE_PROBE.badgesLimit);

  const lp = levelProgressFromXp(u.points ?? 0);
  return corsJson(req, 200, {
    ok: true,
    profile: {
      walletAddress: u.walletAddress,
      xp: u.points ?? 0,
      level: lp.level,
      levelProgress: lp,
      badges: badges.map((b) => ({ slug: b.slug, title: b.title, rarity: b.rarity, awardedAt: b.awardedAt.toISOString() })),
    },
  });
}