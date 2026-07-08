import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireUser } from '@/api/lib/authUser';
import { corsJson, corsOptions, readJson } from '@/api/lib/http';
import { awardPoints } from '@/api/lib/points';
import { isValidQuestClaimPost, parseQuestClaimPostBody, QUEST_CLAIM_PROBE } from '@/api/lib/questClaim';
import { bootstrapGamification, todayKeyUtc } from '@/api/gamification/lib/gamification';

export { QUEST_CLAIM_PATH, QUEST_CLAIM_PROBE } from '@/api/lib/questClaim';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, QUEST_CLAIM_PROBE.methods.join(', '));
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const user = await requireUser(req);
  if (!user) return corsJson(req, QUEST_CLAIM_PROBE.unauthenticatedStatus, { error: 'Unauthorized' });

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return corsJson(req, 400, { error: QUEST_CLAIM_PROBE.invalidJsonError });
  }

  const parsed = parseQuestClaimPostBody(body);
  if (!isValidQuestClaimPost(parsed)) return corsJson(req, 400, { error: QUEST_CLAIM_PROBE.invalidQuestError });

  const db = getDb();
  await bootstrapGamification(db);

  const [quest] = await db
    .select({
      id: schema.quests.id,
      slug: schema.quests.slug,
      kind: schema.quests.kind,
      targetCount: schema.quests.targetCount,
      pointsReward: schema.quests.pointsReward,
      requiresProof: schema.quests.requiresProof,
    })
    .from(schema.quests)
    .where(and(eq(schema.quests.slug, parsed.questSlug), eq(schema.quests.active, true)))
    .limit(1);
  if (!quest) return corsJson(req, 404, { error: QUEST_CLAIM_PROBE.notFoundError });

  const day = todayKeyUtc();
  const dayKey = quest.kind === 'daily' ? day : QUEST_CLAIM_PROBE.seasonalDayKey;

  const [row] = await db
    .select({
      id: schema.userQuestProgress.id,
      progress: schema.userQuestProgress.progress,
      status: schema.userQuestProgress.status,
    })
    .from(schema.userQuestProgress)
    .where(
      and(
        eq(schema.userQuestProgress.userId, user.id),
        eq(schema.userQuestProgress.questId, quest.id),
        eq(schema.userQuestProgress.day, dayKey),
      ),
    )
    .limit(1);

  const progress = row?.progress ?? 0;
  const target = quest.targetCount ?? 1;
  if (progress < target) return corsJson(req, 409, { error: QUEST_CLAIM_PROBE.notCompletedError });
  if (row?.status === 'claimed') return corsJson(req, 200, { ok: true, claimed: true });
  if (quest.requiresProof && !parsed.proofUrl) return corsJson(req, 400, { error: QUEST_CLAIM_PROBE.proofRequiredError });

  if (quest.requiresProof) {
    await db
      .insert(schema.userQuestProgress)
      .values({
        userId: user.id,
        questId: quest.id,
        day: dayKey,
        progress,
        status: 'pending_review',
        proofUrl: parsed.proofUrl,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [schema.userQuestProgress.userId, schema.userQuestProgress.questId, schema.userQuestProgress.day],
        set: { status: 'pending_review', proofUrl: parsed.proofUrl, completedAt: new Date(), updatedAt: new Date() },
      });
    return corsJson(req, 200, { ok: true, pendingReview: true });
  }

  if (quest.pointsReward <= 0) {
    await db
      .insert(schema.userQuestProgress)
      .values({
        userId: user.id,
        questId: quest.id,
        day: dayKey,
        progress,
        status: 'claimed',
        completedAt: new Date(),
        claimedAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [schema.userQuestProgress.userId, schema.userQuestProgress.questId, schema.userQuestProgress.day],
        set: { status: 'claimed', claimedAt: new Date(), updatedAt: new Date() },
      });
    return corsJson(req, 200, { ok: true, claimed: true, awarded: false, delta: 0 });
  }

  const res = await db.transaction(async (tx) => {
    const { awarded } = await awardPoints(tx as unknown as typeof db, user.id, quest.pointsReward, 'quest', {
      dedupeKey: `quest:${quest.id}:${dayKey || 'seasonal'}`,
      meta: { quest: quest.slug, activity: 'quest_claim', day },
    });
    await tx
      .insert(schema.userQuestProgress)
      .values({
        userId: user.id,
        questId: quest.id,
        day: dayKey,
        progress,
        status: 'claimed',
        completedAt: new Date(),
        claimedAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [schema.userQuestProgress.userId, schema.userQuestProgress.questId, schema.userQuestProgress.day],
        set: { status: 'claimed', claimedAt: new Date(), updatedAt: new Date() },
      });
    return { awarded };
  });

  return corsJson(req, 200, { ok: true, claimed: true, awarded: res.awarded, delta: quest.pointsReward });
}