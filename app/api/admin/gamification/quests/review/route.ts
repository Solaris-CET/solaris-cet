import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { writeAdminAudit } from '@/api/lib/adminAudit';
import { guardAdminRoute } from '@/api/lib/adminAuth';
import {
  ADMIN_GAMIFICATION_QUEST_REVIEW_PROBE,
  parseQuestReviewBody,
} from '../../../../lib/adminGamificationQuestReview';
import { getAllowedOrigin } from '@/api/lib/cors';
import { corsJson, corsOptions, readJson } from '@/api/lib/http';
import { awardPoints } from '@/api/lib/points';
import { withRateLimit } from '@/api/lib/rateLimit';

export {
  ADMIN_GAMIFICATION_QUEST_REVIEW_PATH,
  ADMIN_GAMIFICATION_QUEST_REVIEW_PROBE,
} from '../../../../lib/adminGamificationQuestReview';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');

  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (origin && allowedOrigin !== origin) return corsJson(req, 403, { error: 'Forbidden' });

  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: ADMIN_GAMIFICATION_QUEST_REVIEW_PROBE.rateLimitKey,
    limit: 60,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const ctx = await guardAdminRoute(req, { minRole: ADMIN_GAMIFICATION_QUEST_REVIEW_PROBE.minRole });
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const parsed = parseQuestReviewBody(await readJson(req).catch(() => null));
  if (!parsed.ok) return corsJson(req, 400, { error: parsed.error });
  const { progressId, decision } = parsed;

  const db = getDb();
  const [row] = await db
    .select({
      id: schema.userQuestProgress.id,
      userId: schema.userQuestProgress.userId,
      questId: schema.userQuestProgress.questId,
      day: schema.userQuestProgress.day,
      status: schema.userQuestProgress.status,
    })
    .from(schema.userQuestProgress)
    .where(eq(schema.userQuestProgress.id, progressId))
    .limit(1);
  if (!row) return corsJson(req, 404, { error: 'Not found' });
  if (row.status !== ADMIN_GAMIFICATION_QUEST_REVIEW_PROBE.pendingStatus) return corsJson(req, 409, { error: 'Not pending' });

  const [quest] = await db
    .select({ slug: schema.quests.slug, pointsReward: schema.quests.pointsReward, requiresProof: schema.quests.requiresProof })
    .from(schema.quests)
    .where(and(eq(schema.quests.id, row.questId), eq(schema.quests.active, true)))
    .limit(1);
  if (!quest) return corsJson(req, 404, { error: 'Quest not found' });
  if (!quest.requiresProof) return corsJson(req, 409, { error: 'Quest does not require proof' });

  if (decision === 'reject') {
    await db
      .update(schema.userQuestProgress)
      .set({ status: 'rejected', updatedAt: new Date() })
      .where(eq(schema.userQuestProgress.id, row.id));
    await writeAdminAudit(req, ctx, ADMIN_GAMIFICATION_QUEST_REVIEW_PROBE.auditAction, 'user_quest_progress', row.id, {
      decision: 'reject',
      questId: row.questId,
      userId: row.userId,
    });
    return corsJson(req, 200, { ok: true, rejected: true });
  }

  const result = await db.transaction(async (tx) => {
    let awarded = false;
    if ((quest.pointsReward ?? 0) > 0) {
      const r = await awardPoints(tx as unknown as typeof db, row.userId, quest.pointsReward, 'quest', {
        dedupeKey: `quest:${row.questId}:${row.day || 'seasonal'}`,
        meta: { quest: quest.slug, activity: 'quest_claim' },
      });
      awarded = r.awarded;
    }
    await tx
      .update(schema.userQuestProgress)
      .set({ status: 'claimed', claimedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.userQuestProgress.id, row.id));
    return { awarded };
  });

  await writeAdminAudit(req, ctx, ADMIN_GAMIFICATION_QUEST_REVIEW_PROBE.auditAction, 'user_quest_progress', row.id, {
    decision: 'approve',
    questId: row.questId,
    userId: row.userId,
    awarded: result.awarded,
  });
  return corsJson(req, 200, { ok: true, approved: true, awarded: result.awarded });
}