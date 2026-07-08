import { desc, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireUser } from '@/api/lib/authUser';
import { corsJson, corsOptions } from '@/api/lib/http';
import { REWARDS_WEEKLY_PROBE } from '@/api/lib/rewardsWeekly';

export { REWARDS_WEEKLY_PATH, REWARDS_WEEKLY_PROBE } from '@/api/lib/rewardsWeekly';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, REWARDS_WEEKLY_PROBE.methods.join(', '));
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const user = await requireUser(req);
  if (!user) return corsJson(req, REWARDS_WEEKLY_PROBE.unauthenticatedStatus, { error: 'Unauthorized' });

  const db = getDb();
  const rows = await db
    .select({
      weekStart: schema.weeklyLeaderboards.weekStart,
      weekEnd: schema.weeklyLeaderboards.weekEnd,
      rank: schema.weeklyRewards.rank,
      cetAmount: schema.weeklyRewards.cetAmount,
      status: schema.weeklyRewards.status,
      txHash: schema.weeklyRewards.txHash,
      createdAt: schema.weeklyRewards.createdAt,
      sentAt: schema.weeklyRewards.sentAt,
    })
    .from(schema.weeklyRewards)
    .innerJoin(schema.weeklyLeaderboards, eq(schema.weeklyRewards.leaderboardId, schema.weeklyLeaderboards.id))
    .where(eq(schema.weeklyRewards.userId, user.id))
    .orderBy(desc(schema.weeklyRewards.createdAt))
    .limit(REWARDS_WEEKLY_PROBE.listLimit);

  return corsJson(req, 200, {
    ok: true,
    rewards: rows.map((r) => ({
      weekStart: r.weekStart,
      weekEnd: r.weekEnd,
      rank: r.rank,
      cetAmount: String(r.cetAmount),
      status: r.status,
      txHash: r.txHash ?? null,
      createdAt: r.createdAt.toISOString(),
      sentAt: r.sentAt?.toISOString() ?? null,
    })),
  });
}