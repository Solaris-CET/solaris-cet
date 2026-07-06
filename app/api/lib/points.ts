import { and, eq, isNull, or, sql } from 'drizzle-orm';

import type { Database } from '../../db/client';
import { schema } from '../../db/client';

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === '23505'
  );
}

function todayKeyUtc(now = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

function normalizeDayKey(raw: unknown): string {
  const v = typeof raw === 'string' ? raw.trim() : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return todayKeyUtc();
  return v;
}

type CachedUserAge = { createdAtMs: number; fetchedAtMs: number };
const userAgeCache = new Map<string, CachedUserAge>();
const USER_AGE_CACHE_TTL_MS = 10 * 60 * 1000;

async function ageBoostMultiplier(db: Database, userId: string): Promise<number> {
  const now = Date.now();
  const cached = userAgeCache.get(userId);
  if (cached && now - cached.fetchedAtMs < USER_AGE_CACHE_TTL_MS) {
    const days = Math.floor((now - cached.createdAtMs) / (24 * 60 * 60 * 1000));
    if (days >= 180) return 1.2;
    if (days >= 30) return 1.1;
    return 1.0;
  }
  const [u] = await db.select({ createdAt: schema.users.createdAt }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  const createdAtMs = u?.createdAt?.getTime?.() ?? now;
  userAgeCache.set(userId, { createdAtMs, fetchedAtMs: now });
  const days = Math.floor((now - createdAtMs) / (24 * 60 * 60 * 1000));
  if (days >= 180) return 1.2;
  if (days >= 30) return 1.1;
  return 1.0;
}

function activityFromReason(reason: string): string | null {
  const r = reason.trim().toLowerCase();
  if (r === 'ai') return 'ai_ask';
  if (r === 'share') return 'social_share';
  if (r === 'chat') return 'chat_message';
  if (r === 'quiz') return 'quiz_answer';
  if (r === 'giveaway') return 'giveaway_enter';
  if (r === 'channel') return 'channel_join';
  if (r === 'rsvp') return 'rsvp';
  if (r === 'visit') return 'visit';
  if (r === 'referral') return 'referral';
  if (r === 'invite') return 'invite';
  if (r === 'wallet') return 'wallet_connect';
  if (r === 'wheel') return 'wheel_spin';
  if (r === 'quest') return 'quest_claim';
  return null;
}

async function bumpStreak(db: Database, userId: string, day: string): Promise<void> {
  const [row] = await db
    .select({ current: schema.userStreaks.currentStreak, longest: schema.userStreaks.longestStreak, last: schema.userStreaks.lastActiveDay })
    .from(schema.userStreaks)
    .where(eq(schema.userStreaks.userId, userId))
    .limit(1);

  const last = row?.last ?? null;
  if (last === day) return;

  const d = new Date(`${day}T00:00:00.000Z`);
  const y = new Date(d.getTime() - 24 * 60 * 60 * 1000);
  const yesterday = todayKeyUtc(y);

  const nextCurrent = last === yesterday ? (row?.current ?? 0) + 1 : 1;
  const nextLongest = Math.max(row?.longest ?? 0, nextCurrent);

  await db
    .insert(schema.userStreaks)
    .values({ userId, currentStreak: nextCurrent, longestStreak: nextLongest, lastActiveDay: day, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: schema.userStreaks.userId,
      set: { currentStreak: nextCurrent, longestStreak: nextLongest, lastActiveDay: day, updatedAt: new Date() },
    });

  const milestoneBonus: Record<number, number> = { 3: 1, 7: 3, 14: 5, 30: 10 };
  const bonus = milestoneBonus[nextCurrent] ?? 0;
  if (bonus > 0) {
    const dedupeKey = `streak:${nextCurrent}:${day}`;
    try {
      await db.insert(schema.pointsLedger).values({
        userId,
        delta: bonus,
        reason: 'streak',
        dedupeKey,
        meta: { milestone: nextCurrent, day },
      });
      await db
        .update(schema.users)
        .set({ points: sql`${schema.users.points} + ${bonus}` })
        .where(eq(schema.users.id, userId));
    } catch (err) {
      if (!(dedupeKey && isUniqueViolation(err))) throw err;
    }
  }
}

async function bumpQuestProgress(db: Database, userId: string, activity: string, day: string): Promise<void> {
  const now = new Date();
  const quests = await db
    .select({ id: schema.quests.id, kind: schema.quests.kind })
    .from(schema.quests)
    .where(
      and(
        eq(schema.quests.active, true),
        eq(schema.quests.actionKey, activity),
        or(isNull(schema.quests.startsAt), sql`${schema.quests.startsAt} <= ${now}`),
        or(isNull(schema.quests.endsAt), sql`${schema.quests.endsAt} >= ${now}`),
      ),
    )
    .limit(20);

  for (const q of quests) {
    const dayKey = q.kind === 'daily' ? day : '';
    await db
      .insert(schema.userQuestProgress)
      .values({
        userId,
        questId: q.id,
        day: dayKey,
        progress: 1,
        status: 'in_progress',
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [schema.userQuestProgress.userId, schema.userQuestProgress.questId, schema.userQuestProgress.day],
        set: { progress: sql`${schema.userQuestProgress.progress} + 1`, updatedAt: new Date() },
      });
  }
}

export async function awardPoints(
  db: Database,
  userId: string,
  delta: number,
  reason: string,
  opts?: { dedupeKey?: string; meta?: Record<string, unknown> },
): Promise<{ awarded: boolean }>
{
  const dedupeKey = opts?.dedupeKey?.trim() ? opts.dedupeKey.trim().slice(0, 200) : null;
  const metaIn = opts?.meta ?? null;
  const reasonKey = reason.trim().toLowerCase();
  const eligibleForBoost = delta > 0 && (reasonKey === 'ai' || reasonKey === 'share' || reasonKey === 'chat' || reasonKey === 'rsvp' || reasonKey === 'visit');
  let deltaFinal = delta;
  let meta = metaIn;
  if (eligibleForBoost) {
    try {
      const mult = await ageBoostMultiplier(db, userId);
      if (mult > 1.0) {
        const boosted = Math.max(1, Math.floor(delta * mult));
        if (boosted !== delta) {
          deltaFinal = boosted;
          meta = { ...(metaIn ?? {}), baseDelta: delta, multiplier: mult, boosted: true };
        }
      }
    } catch {
      void 0;
    }
  }

  try {
    await db.insert(schema.pointsLedger).values({
      userId,
      delta: deltaFinal,
      reason: reason.slice(0, 80),
      dedupeKey,
      meta,
    });
  } catch (err) {
    if (dedupeKey && isUniqueViolation(err)) return { awarded: false };
    throw err;
  }

  await db
    .update(schema.users)
    .set({ points: sql`${schema.users.points} + ${deltaFinal}` })
    .where(eq(schema.users.id, userId));

  if (deltaFinal > 0) {
    const m = meta as Record<string, unknown> | null;
    const day = normalizeDayKey(m?.day);
    const activity = typeof m?.activity === 'string' ? m.activity.trim() : activityFromReason(reason);
    try {
      await bumpStreak(db, userId, day);
    } catch {
      void 0;
    }
    if (activity) {
      try {
        await bumpQuestProgress(db, userId, activity, day);
      } catch {
        void 0;
      }
    }
  }

  return { awarded: true };
}
