import { and, desc, eq, inArray, sql } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireUser } from '@/api/lib/authUser';
import { ensureGamificationMeBadge, GAMIFICATION_ME_PROBE } from '@/api/lib/gamificationMe';
import { corsJson, corsOptions } from '@/api/lib/http';
import { bootstrapGamification, levelCosmeticUnlocks, levelProgressFromXp, listActiveQuests, todayKeyUtc, vipTierFrom } from '@/api/gamification/lib/gamification';

export { GAMIFICATION_ME_PATH, GAMIFICATION_ME_PROBE } from '@/api/lib/gamificationMe';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, GAMIFICATION_ME_PROBE.methods.join(', '));
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const user = await requireUser(req);
  if (!user) return corsJson(req, GAMIFICATION_ME_PROBE.unauthenticatedStatus, { error: 'Unauthorized' });

  const db = getDb();
  await bootstrapGamification(db);

  const [u] = await db
    .select({
      id: schema.users.id,
      walletAddress: schema.users.walletAddress,
      points: schema.users.points,
      referralCode: schema.users.referralCode,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(eq(schema.users.id, user.id))
    .limit(1);
  if (!u) return corsJson(req, GAMIFICATION_ME_PROBE.unauthenticatedStatus, { error: 'Unauthorized' });

  const xp = u.points ?? 0;
  const progress = levelProgressFromXp(xp);
  const unlocks = levelCosmeticUnlocks(progress.level);

  const day = todayKeyUtc();
  const [streak] = await db
    .select({
      currentStreak: schema.userStreaks.currentStreak,
      longestStreak: schema.userStreaks.longestStreak,
      lastActiveDay: schema.userStreaks.lastActiveDay,
    })
    .from(schema.userStreaks)
    .where(eq(schema.userStreaks.userId, u.id))
    .limit(1);
  const vip = vipTierFrom(progress.level, streak?.currentStreak ?? 0);

  const quests = await listActiveQuests(db);
  const questIds = quests.map((q) => q.id);
  const progressRows =
    questIds.length === 0
      ? []
      : await db
          .select({
            questId: schema.userQuestProgress.questId,
            day: schema.userQuestProgress.day,
            progress: schema.userQuestProgress.progress,
            status: schema.userQuestProgress.status,
            proofUrl: schema.userQuestProgress.proofUrl,
          })
          .from(schema.userQuestProgress)
          .where(and(eq(schema.userQuestProgress.userId, u.id), inArray(schema.userQuestProgress.questId, questIds)))
          .limit(GAMIFICATION_ME_PROBE.questProgressLimit);

  const byKey = new Map<string, { progress: number; status: string; proofUrl: string | null }>();
  for (const r of progressRows) {
    const k = `${r.questId}:${r.day}`;
    byKey.set(k, { progress: r.progress ?? 0, status: r.status, proofUrl: r.proofUrl ?? null });
  }

  const dailyQuests = quests
    .filter((q) => q.kind === 'daily')
    .map((q) => {
      const k = `${q.id}:${day}`;
      const row = byKey.get(k);
      const p = row?.progress ?? 0;
      const done = p >= (q.targetCount ?? 1);
      const status =
        row?.status === 'claimed'
          ? 'claimed'
          : row?.status === 'pending_review'
            ? 'pending_review'
            : done
              ? 'completed'
              : 'in_progress';
      return {
        slug: q.slug,
        title: q.title,
        description: q.description,
        actionKey: q.actionKey,
        targetCount: q.targetCount,
        progress: p,
        pointsReward: q.pointsReward,
        requiresProof: q.requiresProof,
        status,
      };
    });

  const seasonalQuests = quests
    .filter((q) => q.kind !== 'daily')
    .map((q) => {
      const k = `${q.id}:`;
      const row = byKey.get(k);
      const p = row?.progress ?? 0;
      const done = p >= (q.targetCount ?? 1);
      const status =
        row?.status === 'claimed'
          ? 'claimed'
          : row?.status === 'pending_review'
            ? 'pending_review'
            : done
              ? 'completed'
              : 'in_progress';
      return {
        slug: q.slug,
        title: q.title,
        description: q.description,
        actionKey: q.actionKey,
        targetCount: q.targetCount,
        progress: p,
        pointsReward: q.pointsReward,
        requiresProof: q.requiresProof,
        status,
      };
    });

  await ensureGamificationMeBadge(db, u.id, 'wallet-connected');
  if (xp > 0) await ensureGamificationMeBadge(db, u.id, 'first-xp');
  if ((streak?.currentStreak ?? 0) >= GAMIFICATION_ME_PROBE.streakBadgeThreshold) {
    await ensureGamificationMeBadge(db, u.id, 'streak-7');
  }

  const [refCount] = await db
    .select({ c: sql<number>`count(*)` })
    .from(schema.referrals)
    .where(eq(schema.referrals.referrerUserId, u.id));
  if ((refCount?.c ?? 0) > 0) await ensureGamificationMeBadge(db, u.id, 'referral-1');

  const badgesRows = await db
    .select({
      slug: schema.badges.slug,
      title: schema.badges.title,
      description: schema.badges.description,
      rarity: schema.badges.rarity,
      awardedAt: schema.userBadges.awardedAt,
    })
    .from(schema.userBadges)
    .innerJoin(schema.badges, eq(schema.userBadges.badgeId, schema.badges.id))
    .where(eq(schema.userBadges.userId, u.id))
    .orderBy(desc(schema.userBadges.awardedAt))
    .limit(GAMIFICATION_ME_PROBE.badgesLimit);

  const equipped = await db
    .select({
      slug: schema.shopItems.slug,
      kind: schema.shopItems.kind,
      title: schema.shopItems.title,
      meta: schema.shopItems.meta,
      equipped: schema.userInventory.equipped,
      acquiredAt: schema.userInventory.acquiredAt,
    })
    .from(schema.userInventory)
    .innerJoin(schema.shopItems, eq(schema.userInventory.itemId, schema.shopItems.id))
    .where(and(eq(schema.userInventory.userId, u.id), eq(schema.userInventory.equipped, true)))
    .limit(GAMIFICATION_ME_PROBE.equippedLimit);

  return corsJson(req, 200, {
    ok: true,
    user: { walletAddress: u.walletAddress, referralCode: u.referralCode },
    xp,
    level: progress.level,
    levelProgress: progress,
    cosmeticUnlocks: unlocks,
    vip,
    streak: {
      current: streak?.currentStreak ?? 0,
      longest: streak?.longestStreak ?? 0,
      lastActiveDay: streak?.lastActiveDay ?? null,
    },
    day,
    quests: { daily: dailyQuests, active: seasonalQuests },
    badges: badgesRows.map((b) => ({
      slug: b.slug,
      title: b.title,
      description: b.description,
      rarity: b.rarity,
      awardedAt: b.awardedAt.toISOString(),
    })),
    equipped,
  });
}