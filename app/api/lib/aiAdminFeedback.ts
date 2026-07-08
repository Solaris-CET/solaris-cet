export const AI_ADMIN_FEEDBACK_PATH = '/api/ai/admin/feedback';
export const AI_ADMIN_FEEDBACK_METHODS = 'GET, OPTIONS';

export const AI_ADMIN_FEEDBACK_PROBE = {
  path: AI_ADMIN_FEEDBACK_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  adminRequired: true,
  defaultLimit: 200,
  minLimit: 1,
  maxLimit: 500,
  window7dMs: 7 * 24 * 60 * 60 * 1000,
  window24hMs: 24 * 60 * 60 * 1000,
  maxCommentLength: 800,
  userHashLength: 10,
};

export function parseAiAdminFeedbackLimit(searchParams: URLSearchParams): number {
  const n = Number(searchParams.get('limit'));
  if (!Number.isFinite(n)) return AI_ADMIN_FEEDBACK_PROBE.defaultLimit;
  return Math.max(AI_ADMIN_FEEDBACK_PROBE.minLimit, Math.min(AI_ADMIN_FEEDBACK_PROBE.maxLimit, Math.trunc(n)));
}

export function aiAdminFeedbackSince7d(now = Date.now()): Date {
  return new Date(now - AI_ADMIN_FEEDBACK_PROBE.window7dMs);
}

export function aiAdminFeedbackSince24h(now = Date.now()): Date {
  return new Date(now - AI_ADMIN_FEEDBACK_PROBE.window24hMs);
}

export function normalizeAvgQualityScore(raw: unknown): number | null {
  return typeof raw === 'number' && Number.isFinite(raw) ? Number(raw) : null;
}

export function anonymizeAiAdminUserId(userId: string | null | undefined, hash: (v: string) => string): string {
  return userId ? hash(userId).slice(0, AI_ADMIN_FEEDBACK_PROBE.userHashLength) : 'anon';
}