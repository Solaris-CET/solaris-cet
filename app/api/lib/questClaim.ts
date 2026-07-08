export const QUEST_CLAIM_PATH = '/api/gamification/quests/claim';
export const QUEST_CLAIM_METHODS = 'POST, OPTIONS';

export const QUEST_CLAIM_PROBE = {
  path: QUEST_CLAIM_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  maxProofUrlLength: 600,
  invalidJsonError: 'Invalid JSON' as const,
  invalidQuestError: 'Invalid quest' as const,
  notFoundError: 'Quest not found' as const,
  notCompletedError: 'Not completed' as const,
  proofRequiredError: 'Proof required' as const,
  seasonalDayKey: '' as const,
};

export type QuestClaimPostBody = { questSlug: string; proofUrl: string };

export function parseQuestClaimPostBody(body: unknown): QuestClaimPostBody {
  const questSlug =
    typeof (body as { questSlug?: unknown })?.questSlug === 'string' ? (body as { questSlug: string }).questSlug.trim() : '';
  const proofUrl =
    typeof (body as { proofUrl?: unknown })?.proofUrl === 'string'
      ? (body as { proofUrl: string }).proofUrl.trim().slice(0, QUEST_CLAIM_PROBE.maxProofUrlLength)
      : '';
  return { questSlug, proofUrl };
}

export function isValidQuestClaimPost(body: QuestClaimPostBody): boolean {
  return Boolean(body.questSlug);
}