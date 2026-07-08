import { and, desc, gte, inArray, isNotNull, sql } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { corsJson, corsOptions } from '@/api/lib/http';
import {
  buildRewardsLeaderboardPayload,
  mapAiLeaderboardRows,
  REWARDS_LEADERBOARD_PROBE,
  rewardsLeaderboardSince,
} from '../../lib/rewardsLeaderboard';

export { REWARDS_LEADERBOARD_PATH, REWARDS_LEADERBOARD_PROBE } from '@/api/lib/rewardsLeaderboard';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return corsOptions(req, REWARDS_LEADERBOARD_PROBE.methods.join(', '));
  }
  if (req.method !== 'GET') {
    return corsJson(req, 405, { error: 'Method not allowed' });
  }

  const db = getDb();
  const topPoints = await db
    .select({
      userId: schema.users.id,
      walletAddress: schema.users.walletAddress,
      points: schema.users.points,
    })
    .from(schema.users)
    .orderBy(desc(schema.users.points))
    .limit(REWARDS_LEADERBOARD_PROBE.pointsLimit);

  const since = rewardsLeaderboardSince();
  const topAi = await db
    .select({
      userId: schema.aiQueryLogs.userId,
      aiQueries: sql<number>`count(*)`.as('ai_queries'),
    })
    .from(schema.aiQueryLogs)
    .where(and(isNotNull(schema.aiQueryLogs.userId), gte(schema.aiQueryLogs.createdAt, since)))
    .groupBy(schema.aiQueryLogs.userId)
    .orderBy(desc(sql`count(*)`))
    .limit(REWARDS_LEADERBOARD_PROBE.aiLimit);

  const aiUserIds = topAi.map((r) => r.userId).filter((v): v is string => typeof v === 'string');
  const aiUsers = aiUserIds.length
    ? await db
        .select({ id: schema.users.id, walletAddress: schema.users.walletAddress })
        .from(schema.users)
        .where(inArray(schema.users.id, aiUserIds))
    : [];
  const aiWalletById = new Map(aiUsers.map((u) => [u.id, u.walletAddress]));

  return corsJson(
    req,
    200,
    buildRewardsLeaderboardPayload({
      points: topPoints,
      ai: mapAiLeaderboardRows(topAi, aiWalletById),
    }),
  );
}