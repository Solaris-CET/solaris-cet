import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '../../../../db/client';
import { requireUser } from '../../../lib/authUser';
import { corsJson, corsOptions, readJson } from '../../../lib/http';
import { awardPoints } from '../../../lib/points';
import { bootstrapGamification, todayKeyUtc } from '../../lib/gamification';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const user = await requireUser(req);
  if (!user) return corsJson(req, 401, { error: 'Unauthorized' });

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return corsJson(req, 400, { error: 'Invalid JSON' });
  }

  const questSlug = typeof (body as { questSlug?: unknown })?.questSlug === 'string' ? (body as { questSlug: string }).questSlug.trim() : '';
  const proofUrl = typeof (body as { proofUrl?: unknown })?.proofUrl === 'string' ? (body as { proofUrl: string }).proofUrl.trim().slice(0, 600) : '';
  if (!questSlug) return corsJson(req, 400, { error: 'Invalid quest' });

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
    .where(and(eq(schema.quests.slug, questSlug), eq(schema.quests.active, true)))
    .limit(1);
  if (!quest) return corsJson(req, 404, { error: 'Quest not found' });

  const day = todayKeyUtc();
  const dayKey = quest.kind === 'daily' ? day : '';

  const [row] = await db
    .select({
      id: schema.userQuestProgress.id,
      progress: schema.userQuestProgress.progress,
      status: schema.userQuestProgress.status,
    })
    .from(schema.userQuestProgress)
    .where(and(eq(schema.userQuestProgress.userId, user.id), eq(schema.userQuestProgress.questId, quest.id), eq(schema.userQuestProgress.day, dayKey)))
    .limit(1);

  const progress = row?.progress ?? 0;
  const target = quest.targetCount ?? 1;
  if (progress < target) return corsJson(req, 409, { error: 'Not completed' });
  if (row?.status === 'claimed') return corsJson(req, 200, { ok: true, claimed: true });
  if (quest.requiresProof && !proofUrl) return corsJson(req, 400, { error: 'Proof required' });

  if (quest.requiresProof) {
    await db
      .insert(schema.userQuestProgress)
      .values({
        userId: user.id,
        questId: quest.id,
        day: dayKey,
        progress,
        status: 'pending_review',
        proofUrl,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [schema.userQuestProgress.userId, schema.userQuestProgress.questId, schema.userQuestProgress.day],
        set: { status: 'pending_review', proofUrl, completedAt: new Date(), updatedAt: new Date() },
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

