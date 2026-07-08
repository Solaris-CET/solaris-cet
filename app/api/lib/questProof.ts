export const QUEST_PROOF_PATH = '/api/gamification/quests/proof';
export const QUEST_PROOF_METHODS = 'POST, OPTIONS';

export const QUEST_PROOF_PROBE = {
  path: QUEST_PROOF_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  maxProofUrlLength: 600,
  seasonalDayKey: '' as const,
  invalidJsonError: 'Invalid JSON' as const,
  invalidRequestError: 'Invalid request' as const,
  notFoundError: 'Quest not found' as const,
  proofNotRequiredError: 'Proof not required' as const,
};

export type QuestProofPostBody = { questSlug: string; proofUrl: string };

export function parseQuestProofPostBody(body: unknown): QuestProofPostBody {
  const questSlug =
    typeof (body as { questSlug?: unknown })?.questSlug === 'string' ? (body as { questSlug: string }).questSlug.trim() : '';
  const proofUrl =
    typeof (body as { proofUrl?: unknown })?.proofUrl === 'string'
      ? (body as { proofUrl: string }).proofUrl.trim().slice(0, QUEST_PROOF_PROBE.maxProofUrlLength)
      : '';
  return { questSlug, proofUrl };
}

export function isValidQuestProofPost(body: QuestProofPostBody): boolean {
  return Boolean(body.questSlug && body.proofUrl);
}