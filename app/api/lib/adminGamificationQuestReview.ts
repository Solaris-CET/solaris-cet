export const ADMIN_GAMIFICATION_QUEST_REVIEW_PATH = '/api/admin/gamification/quests/review';
export const ADMIN_GAMIFICATION_QUEST_REVIEW_METHODS = 'POST, OPTIONS';

export const ADMIN_GAMIFICATION_QUEST_REVIEW_DECISIONS = ['approve', 'reject'] as const;
export type QuestReviewDecision = (typeof ADMIN_GAMIFICATION_QUEST_REVIEW_DECISIONS)[number];

export const ADMIN_GAMIFICATION_QUEST_REVIEW_PROBE = {
  path: ADMIN_GAMIFICATION_QUEST_REVIEW_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  minRole: 'editor' as const,
  unauthenticatedStatus: 401,
  rateLimitKey: 'admin-quest-review',
  auditAction: 'QUEST_REVIEWED' as const,
  pendingStatus: 'pending_review' as const,
};

export type QuestReviewBody =
  | { ok: true; progressId: string; decision: QuestReviewDecision }
  | { ok: false; error: 'Invalid request' };

export function parseQuestReviewBody(body: unknown): QuestReviewBody {
  const progressId =
    typeof (body as { progressId?: unknown })?.progressId === 'string'
      ? (body as { progressId: string }).progressId.trim()
      : '';
  const decision =
    typeof (body as { decision?: unknown })?.decision === 'string'
      ? (body as { decision: string }).decision.trim()
      : '';
  if (!progressId || (decision !== 'approve' && decision !== 'reject')) {
    return { ok: false, error: 'Invalid request' };
  }
  return { ok: true, progressId, decision };
}