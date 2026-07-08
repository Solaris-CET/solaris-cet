import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';

export const GAMIFICATION_ME_PATH = '/api/gamification/me';
export const GAMIFICATION_ME_METHODS = 'GET, OPTIONS';

export const GAMIFICATION_ME_BADGE_SLUGS = ['wallet-connected', 'first-xp', 'streak-7', 'referral-1'] as const;

export const GAMIFICATION_ME_PROBE = {
  path: GAMIFICATION_ME_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  questProgressLimit: 200,
  badgesLimit: 200,
  equippedLimit: 20,
  streakBadgeThreshold: 7,
  badgeSlugs: GAMIFICATION_ME_BADGE_SLUGS,
};

export async function ensureGamificationMeBadge(db: ReturnType<typeof getDb>, userId: string, slug: string): Promise<void> {
  const [b] = await db
    .select({ id: schema.badges.id })
    .from(schema.badges)
    .where(and(eq(schema.badges.slug, slug), eq(schema.badges.active, true)))
    .limit(1);
  if (!b?.id) return;
  await db.insert(schema.userBadges).values({ userId, badgeId: b.id }).onConflictDoNothing();
}