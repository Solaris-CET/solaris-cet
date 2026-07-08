import { eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireUser } from '@/api/lib/authUser';
import { corsJson, corsOptions, readJson } from '@/api/lib/http';
import { isValidQuestProofPost, parseQuestProofPostBody, QUEST_PROOF_PROBE } from '@/api/lib/questProof';
import { bootstrapGamification } from '@/api/gamification/lib/gamification';

export { QUEST_PROOF_PATH, QUEST_PROOF_PROBE } from '@/api/lib/questProof';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, QUEST_PROOF_PROBE.methods.join(', '));
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const user = await requireUser(req);
  if (!user) return corsJson(req, QUEST_PROOF_PROBE.unauthenticatedStatus, { error: 'Unauthorized' });

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return corsJson(req, 400, { error: QUEST_PROOF_PROBE.invalidJsonError });
  }

  const parsed = parseQuestProofPostBody(body);
  if (!isValidQuestProofPost(parsed)) return corsJson(req, 400, { error: QUEST_PROOF_PROBE.invalidRequestError });

  const db = getDb();
  await bootstrapGamification(db);

  const [quest] = await db
    .select({
      id: schema.quests.id,
      targetCount: schema.quests.targetCount,
      requiresProof: schema.quests.requiresProof,
      active: schema.quests.active,
    })
    .from(schema.quests)
    .where(eq(schema.quests.slug, parsed.questSlug))
    .limit(1);
  if (!quest || !quest.active) return corsJson(req, 404, { error: QUEST_PROOF_PROBE.notFoundError });
  if (!quest.requiresProof) return corsJson(req, 400, { error: QUEST_PROOF_PROBE.proofNotRequiredError });

  await db
    .insert(schema.userQuestProgress)
    .values({
      userId: user.id,
      questId: quest.id,
      day: QUEST_PROOF_PROBE.seasonalDayKey,
      progress: quest.targetCount ?? 1,
      status: 'pending_review',
      proofUrl: parsed.proofUrl,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [schema.userQuestProgress.userId, schema.userQuestProgress.questId, schema.userQuestProgress.day],
      set: {
        progress: quest.targetCount ?? 1,
        status: 'pending_review',
        proofUrl: parsed.proofUrl,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });

  return corsJson(req, 200, { ok: true, pendingReview: true });
}