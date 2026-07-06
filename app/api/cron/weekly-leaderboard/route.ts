import { and, desc, eq, gte, lt, sql } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { cronAuthResult } from '../../lib/cron';
import { corsJson, corsOptions } from '../../lib/http';
import { telegramSendMessage } from '../../telegram/lib';

export const config = { runtime: 'nodejs' };

function env(name: string): string {
  return String(process.env[name] ?? '').trim();
}

function startOfWeekUtc(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay();
  const delta = (day + 6) % 7;
  x.setUTCDate(x.getUTCDate() - delta);
  return x;
}

function dayKeyUtc(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

const WEEKLY_CET_REWARDS: number[] = [50, 30, 20, 10, 8, 6, 5, 4, 3, 2];

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const cron = cronAuthResult(req);
  if (!cron.ok) return corsJson(req, cron.status, { error: cron.error });

  const db = getDb();
  const now = new Date();
  const thisWeek = startOfWeekUtc(now);
  const start = new Date(thisWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
  const end = thisWeek;
  const weekStart = dayKeyUtc(start);
  const weekEnd = dayKeyUtc(new Date(end.getTime() - 24 * 60 * 60 * 1000));

  const [existing] = await db.select({ id: schema.weeklyLeaderboards.id }).from(schema.weeklyLeaderboards).where(eq(schema.weeklyLeaderboards.weekStart, weekStart)).limit(1);
  if (existing?.id) return corsJson(req, 200, { ok: true, weekStart, weekEnd, alreadyGenerated: true });

  const top = await db
    .select({
      userId: schema.pointsLedger.userId,
      xp: sql<number>`sum(${schema.pointsLedger.delta})`,
    })
    .from(schema.pointsLedger)
    .where(and(gte(schema.pointsLedger.createdAt, start), lt(schema.pointsLedger.createdAt, end)))
    .groupBy(schema.pointsLedger.userId)
    .orderBy(desc(sql<number>`sum(${schema.pointsLedger.delta})`))
    .limit(50);

  if (top.length === 0) {
    const [lb] = await db.insert(schema.weeklyLeaderboards).values({ weekStart, weekEnd, generatedAt: new Date(), meta: { empty: true } }).returning({ id: schema.weeklyLeaderboards.id });
    return corsJson(req, 200, { ok: true, weekStart, weekEnd, leaderboardId: lb?.id ?? null, generated: true, empty: true });
  }

  const userIds = top.map((t) => t.userId);
  const totals = await db
    .select({ id: schema.users.id, points: schema.users.points })
    .from(schema.users)
    .where(sql`${schema.users.id} = any(${userIds})`)
    .limit(100);
  const totalById = new Map(totals.map((u) => [u.id, u.points ?? 0]));

  const badgeIdRow = await db
    .select({ id: schema.badges.id })
    .from(schema.badges)
    .where(and(eq(schema.badges.slug, 'top10-weekly'), eq(schema.badges.active, true)))
    .limit(1);
  const top10BadgeId = badgeIdRow[0]?.id ?? null;

  const result = await db.transaction(async (tx) => {
    const [lb] = await tx
      .insert(schema.weeklyLeaderboards)
      .values({ weekStart, weekEnd, generatedAt: new Date(), meta: { start: start.toISOString(), end: end.toISOString() } })
      .returning({ id: schema.weeklyLeaderboards.id });
    const leaderboardId = lb?.id;
    if (!leaderboardId) throw new Error('leaderboard_insert_failed');

    const entries = top.map((t, i) => ({
      leaderboardId,
      userId: t.userId,
      rank: i + 1,
      pointsEarned: Number(t.xp ?? 0),
      totalPoints: totalById.get(t.userId) ?? 0,
    }));
    await tx.insert(schema.weeklyLeaderboardEntries).values(entries);

    const rewards = entries.slice(0, 10).map((e, idx) => ({
      leaderboardId,
      userId: e.userId,
      rank: e.rank,
      cetAmount: String(WEEKLY_CET_REWARDS[idx] ?? 0),
      status: 'pending' as const,
      meta: { source: 'weekly', weekStart, weekEnd },
    }));
    await tx.insert(schema.weeklyRewards).values(rewards);

    if (top10BadgeId) {
      await tx
        .insert(schema.userBadges)
        .values(entries.slice(0, 10).map((e) => ({ userId: e.userId, badgeId: top10BadgeId })))
        .onConflictDoNothing();
    }

    return { leaderboardId, entries: entries.length, rewards: rewards.length };
  });

  const botToken = env('TELEGRAM_BOT_TOKEN');
  const notify = env('TELEGRAM_NOTIFY_WEEKLY');
  if (botToken && notify === '1') {
    try {
      const winners = await db
        .select({
          userId: schema.weeklyRewards.userId,
          rank: schema.weeklyRewards.rank,
          cetAmount: schema.weeklyRewards.cetAmount,
          chatId: schema.telegramLinks.chatId,
          enabled: schema.userSettings.telegramNotificationsEnabled,
        })
        .from(schema.weeklyRewards)
        .leftJoin(schema.telegramLinks, eq(schema.telegramLinks.userId, schema.weeklyRewards.userId))
        .leftJoin(schema.userSettings, eq(schema.userSettings.userId, schema.weeklyRewards.userId))
        .where(eq(schema.weeklyRewards.leaderboardId, result.leaderboardId))
        .orderBy(schema.weeklyRewards.rank)
        .limit(10);
      for (const w of winners) {
        const enabled = w.enabled !== false;
        const chatId = w.chatId ? Number(w.chatId) : NaN;
        if (!enabled || !Number.isFinite(chatId)) continue;
        const msg = `Felicitări! Ai intrat în top 10.\nRank #${w.rank} · Reward ${w.cetAmount ?? '0'} CET (pending)\nSăptămâna: ${weekStart} → ${weekEnd}`;
        await telegramSendMessage(botToken, chatId, msg);
      }
    } catch {
      void 0;
    }
  }

  return corsJson(req, 200, { ok: true, weekStart, weekEnd, ...result });
}
