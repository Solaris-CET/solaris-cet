import { and, eq, isNull, or, sql } from 'drizzle-orm';

import type { Database } from '../../../db/client';
import { schema } from '../../../db/client';

export type LevelProgress = {
  level: number;
  xp: number;
  xpThisLevel: number;
  xpNextLevel: number;
  xpIntoLevel: number;
  xpToNext: number;
  pct: number;
};

export function todayKeyUtc(now = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

export function xpRequiredForLevel(level: number): number {
  const l = Math.max(1, Math.min(50, Math.floor(level)));
  if (l <= 1) return 0;
  const x = l - 1;
  return Math.floor(20 * x * x + 40 * x);
}

export function levelProgressFromXp(xp: number): LevelProgress {
  const xpSafe = Math.max(0, Math.floor(Number.isFinite(xp) ? xp : 0));
  let level = 1;
  for (let l = 2; l <= 50; l += 1) {
    if (xpSafe >= xpRequiredForLevel(l)) level = l;
  }
  const xpThisLevel = xpRequiredForLevel(level);
  const xpNextLevel = level >= 50 ? xpThisLevel : xpRequiredForLevel(level + 1);
  const span = Math.max(1, xpNextLevel - xpThisLevel);
  const xpIntoLevel = Math.min(span, Math.max(0, xpSafe - xpThisLevel));
  const xpToNext = level >= 50 ? 0 : Math.max(0, xpNextLevel - xpSafe);
  const pct = level >= 50 ? 1 : Math.max(0, Math.min(1, xpIntoLevel / span));
  return { level, xp: xpSafe, xpThisLevel, xpNextLevel, xpIntoLevel, xpToNext, pct };
}

export function levelCosmeticUnlocks(level: number): string[] {
  const l = Math.max(1, Math.min(50, Math.floor(level)));
  const unlocks: string[] = [];
  if (l >= 2) unlocks.push('theme:ember');
  if (l >= 5) unlocks.push('theme:aurora');
  if (l >= 10) unlocks.push('ui:cursor_glow_plus');
  if (l >= 15) unlocks.push('emoji_pack:solar');
  if (l >= 20) unlocks.push('skin:hud_pro');
  if (l >= 30) unlocks.push('theme:void_gold');
  if (l >= 40) unlocks.push('badge_frame:obsidian');
  if (l >= 50) unlocks.push('title:solar_vip');
  return unlocks;
}

export function vipTierFrom(level: number, streak: number): { tier: string; label: string } {
  const l = Math.max(1, Math.min(50, Math.floor(level)));
  const s = Math.max(0, Math.floor(streak));
  if (l >= 40 && s >= 14) return { tier: 'platinum', label: 'VIP Platinum' };
  if (l >= 25 && s >= 7) return { tier: 'gold', label: 'VIP Gold' };
  if (l >= 10 && s >= 3) return { tier: 'silver', label: 'VIP Silver' };
  return { tier: 'bronze', label: 'VIP Bronze' };
}

type SeedQuest = {
  slug: string;
  title: string;
  description: string;
  kind: 'daily' | 'seasonal' | 'social';
  actionKey: string;
  targetCount: number;
  pointsReward: number;
  requiresProof?: boolean;
  seasonKey?: string | null;
  meta?: Record<string, unknown>;
};

type SeedBadge = {
  slug: string;
  title: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  pointsBonus?: number;
  tonMetadataUri?: string | null;
};

type SeedShopItem = {
  slug: string;
  title: string;
  description: string;
  kind: string;
  costPoints: number;
  meta?: Record<string, unknown>;
};

const SEED_QUESTS: SeedQuest[] = [
  {
    slug: 'daily-ask-ai',
    title: 'Întreabă AI-ul ceva nou',
    description: 'Pune o întrebare nouă în CET AI.',
    kind: 'daily',
    actionKey: 'ai_ask',
    targetCount: 1,
    pointsReward: 1,
  },
  {
    slug: 'daily-visit',
    title: 'Vizită zilnică',
    description: 'Intră în aplicație cel puțin o dată azi.',
    kind: 'daily',
    actionKey: 'visit',
    targetCount: 1,
    pointsReward: 1,
  },
  {
    slug: 'daily-share',
    title: 'Share social',
    description: 'Distribuie Solaris CET pe social media.',
    kind: 'daily',
    actionKey: 'social_share',
    targetCount: 1,
    pointsReward: 2,
  },
  {
    slug: 'daily-quiz',
    title: 'Quiz zilnic',
    description: 'Răspunde corect la quiz în Telegram bot.',
    kind: 'daily',
    actionKey: 'quiz_answer',
    targetCount: 1,
    pointsReward: 3,
    meta: {
      question: 'Ce înseamnă RWA?',
      options: ['Real Wallet Access', 'Real-World Asset', 'Random Web API'],
      correct: 'B',
    },
  },
  {
    slug: 'social-proof',
    title: 'Quest social (proof)',
    description: 'Adaugă un link de proof (follow/like/retweet).',
    kind: 'social',
    actionKey: 'social_proof',
    targetCount: 1,
    pointsReward: 3,
    requiresProof: true,
  },
  {
    slug: 'season-ai-month',
    title: 'Provocare sezonieră: Luna AI',
    description: 'Pune 30 de întrebări în CET AI (bonus la claim).',
    kind: 'seasonal',
    actionKey: 'ai_ask',
    targetCount: 30,
    pointsReward: 15,
    seasonKey: 'ai-month',
  },
  {
    slug: 'season-defi-month',
    title: 'Provocare sezonieră: Luna DeFi',
    description: 'Fă 10 activități (chat/RSVP) în comunitate (bonus la claim).',
    kind: 'seasonal',
    actionKey: 'chat_message',
    targetCount: 10,
    pointsReward: 10,
    seasonKey: 'defi-month',
  },
  {
    slug: 'giveaway-solaris',
    title: 'Giveaway: Solaris Community',
    description: 'Intră în giveaway din Telegram bot.',
    kind: 'social',
    actionKey: 'giveaway_enter',
    targetCount: 1,
    pointsReward: 1,
    meta: { note: 'Demo giveaway. Configurează în Admin pentru producție.' },
  },
];

const SEED_BADGES: SeedBadge[] = [
  {
    slug: 'wallet-connected',
    title: 'Wallet Connected',
    description: 'Ai conectat un portofel TON.',
    rarity: 'common',
  },
  {
    slug: 'first-xp',
    title: 'First XP',
    description: 'Ai câștigat primul tău XP.',
    rarity: 'common',
  },
  {
    slug: 'streak-7',
    title: '7-Day Streak',
    description: '7 zile consecutive de activitate.',
    rarity: 'rare',
  },
  {
    slug: 'referral-1',
    title: 'First Referral',
    description: 'Primul referral confirmat.',
    rarity: 'rare',
  },
  {
    slug: 'top10-weekly',
    title: 'Top 10 Weekly',
    description: 'Ai intrat în top 10 la XP într-o săptămână.',
    rarity: 'epic',
    tonMetadataUri: null,
  },
];

const SEED_SHOP_ITEMS: SeedShopItem[] = [
  {
    slug: 'theme-ember',
    title: 'Theme: Ember',
    description: 'Temă cosmetică (unlock la nivel 2).',
    kind: 'theme',
    costPoints: 25,
    meta: { unlock: 'theme:ember' },
  },
  {
    slug: 'emoji-solar-pack',
    title: 'Emoji Pack: Solar',
    description: 'Emoji-uri cosmetice (unlock la nivel 15).',
    kind: 'emoji_pack',
    costPoints: 60,
    meta: { unlock: 'emoji_pack:solar' },
  },
];

export async function bootstrapGamification(db: Database): Promise<void> {
  await db
    .insert(schema.quests)
    .values(
      SEED_QUESTS.map((q) => ({
        slug: q.slug,
        title: q.title,
        description: q.description,
        kind: q.kind,
        actionKey: q.actionKey,
        targetCount: q.targetCount,
        pointsReward: q.pointsReward,
        requiresProof: q.requiresProof ?? false,
        seasonKey: q.seasonKey ?? null,
        meta: q.meta ?? null,
        active: true,
        updatedAt: new Date(),
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(schema.badges)
    .values(
      SEED_BADGES.map((b) => ({
        slug: b.slug,
        title: b.title,
        description: b.description,
        rarity: b.rarity,
        pointsBonus: b.pointsBonus ?? 0,
        tonMetadataUri: b.tonMetadataUri ?? null,
        active: true,
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(schema.shopItems)
    .values(
      SEED_SHOP_ITEMS.map((it) => ({
        slug: it.slug,
        title: it.title,
        description: it.description,
        kind: it.kind,
        costPoints: it.costPoints,
        active: true,
        meta: it.meta ?? null,
        updatedAt: new Date(),
      })),
    )
    .onConflictDoNothing();
}

export async function findReferrerByCode(
  db: Database,
  codeRaw: string,
): Promise<{ userId: string } | null> {
  const code = String(codeRaw ?? '').trim();
  if (!code) return null;
  const [user] = await db
    .select({ userId: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.referralCode, code))
    .limit(1);
  if (user?.userId) return user;

  const [link] = await db
    .select({ userId: schema.affiliateLinks.userId })
    .from(schema.affiliateLinks)
    .where(and(eq(schema.affiliateLinks.code, code), eq(schema.affiliateLinks.active, true)))
    .limit(1);
  return link?.userId ? { userId: link.userId } : null;
}

export async function bumpAffiliateClick(db: Database, codeRaw: string, day: string): Promise<void> {
  const code = String(codeRaw ?? '').trim();
  if (!code) return;
  const [link] = await db
    .select({ id: schema.affiliateLinks.id })
    .from(schema.affiliateLinks)
    .where(and(eq(schema.affiliateLinks.code, code), eq(schema.affiliateLinks.active, true)))
    .limit(1);
  if (!link?.id) return;

  await db
    .insert(schema.affiliateClicksDaily)
    .values({ affiliateLinkId: link.id, day, count: 1, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [schema.affiliateClicksDaily.affiliateLinkId, schema.affiliateClicksDaily.day],
      set: { count: sql`${schema.affiliateClicksDaily.count} + 1`, updatedAt: new Date() },
    });
}

export async function listActiveQuests(db: Database, now = new Date()) {
  const rows = await db
    .select({
      id: schema.quests.id,
      slug: schema.quests.slug,
      title: schema.quests.title,
      description: schema.quests.description,
      kind: schema.quests.kind,
      actionKey: schema.quests.actionKey,
      targetCount: schema.quests.targetCount,
      pointsReward: schema.quests.pointsReward,
      requiresProof: schema.quests.requiresProof,
    })
    .from(schema.quests)
    .where(
      and(
        eq(schema.quests.active, true),
        or(isNull(schema.quests.startsAt), sql`${schema.quests.startsAt} <= ${now}`),
        or(isNull(schema.quests.endsAt), sql`${schema.quests.endsAt} >= ${now}`),
      ),
    )
    .limit(100);
  return rows;
}
