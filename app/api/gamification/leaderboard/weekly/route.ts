import { and, desc, gte, lt, sql } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { corsJson, corsOptions } from '@/api/lib/http';
import { dayKeyUtc, LEADERBOARD_WEEKLY_PROBE, startOfWeekUtc } from '@/api/lib/leaderboardWeekly';

export { LEADERBOARD_WEEKLY_PATH, LEADERBOARD_WEEKLY_PROBE } from '@/api/lib/leaderboardWeekly';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, LEADERBOARD_WEEKLY_PROBE.methods.join(', '));
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const db = getDb();
  const now = new Date();
  const start = startOfWeekUtc(now);
  const end = new Date(start.getTime() + LEADERBOARD_WEEKLY_PROBE.weekDays * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      userId: schema.pointsLedger.userId,
      xp: sql<number>`sum(${schema.pointsLedger.delta})`,
    })
    .from(schema.pointsLedger)
    .where(and(gte(schema.pointsLedger.createdAt, start), lt(schema.pointsLedger.createdAt, end)))
    .groupBy(schema.pointsLedger.userId)
    .orderBy(desc(sql<number>`sum(${schema.pointsLedger.delta})`))
    .limit(LEADERBOARD_WEEKLY_PROBE.listLimit);

  const userIds = rows.map((r) => r.userId);
  const users =
    userIds.length === 0
      ? []
      : await db
          .select({ id: schema.users.id, walletAddress: schema.users.walletAddress, points: schema.users.points })
          .from(schema.users)
          .where(sql`${schema.users.id} = any(${userIds})`)
          .limit(LEADERBOARD_WEEKLY_PROBE.userLookupLimit);
  const byId = new Map(users.map((u) => [u.id, u]));

  return corsJson(req, 200, {
    ok: true,
    weekStart: dayKeyUtc(start),
    weekEnd: dayKeyUtc(new Date(end.getTime() - 24 * 60 * 60 * 1000)),
    items: rows.map((r, i) => {
      const u = byId.get(r.userId);
      return {
        rank: i + 1,
        walletAddress: u?.walletAddress ?? null,
        xpEarned: Number(r.xp ?? 0),
        totalXp: u?.points ?? null,
      };
    }),
  });
}