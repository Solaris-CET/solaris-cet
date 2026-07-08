export const REWARDS_LEADERBOARD_PATH = '/api/rewards/leaderboard';
export const REWARDS_LEADERBOARD_METHODS = 'GET, OPTIONS';

export const REWARDS_LEADERBOARD_PROBE = {
  path: REWARDS_LEADERBOARD_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  pointsLimit: 20,
  aiLimit: 20,
  windowDays: 7,
};

export type PointsLeaderboardRow = {
  userId: string;
  walletAddress: string | null;
  points: number;
};

export type AiLeaderboardRow = {
  userId: string | null;
  walletAddress: string | null;
  aiQueries: number;
};

export function rewardsLeaderboardSince(windowDays = REWARDS_LEADERBOARD_PROBE.windowDays): Date {
  return new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
}

export function mapAiLeaderboardRows(
  topAi: Array<{ userId: string | null; aiQueries: number }>,
  walletByUserId: Map<string, string | null>,
): AiLeaderboardRow[] {
  return topAi.map((r) => ({
    userId: r.userId,
    walletAddress: typeof r.userId === 'string' ? walletByUserId.get(r.userId) ?? null : null,
    aiQueries: r.aiQueries,
  }));
}

export function buildRewardsLeaderboardPayload(params: {
  points: PointsLeaderboardRow[];
  ai: AiLeaderboardRow[];
  windowDays?: number;
}) {
  return {
    points: params.points,
    ai: params.ai,
    windowDays: params.windowDays ?? REWARDS_LEADERBOARD_PROBE.windowDays,
  };
}