import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '../../../../../db/client';
import { writeAdminAudit } from '../../../../lib/adminAudit';
import { requireAdminAuth, requireAdminRole } from '../../../../lib/adminAuth';
import { getAllowedOrigin } from '../../../../lib/cors';
import { corsJson, corsOptions, readJson } from '../../../../lib/http';
import { awardPoints } from '../../../../lib/points';
import { withRateLimit } from '../../../../lib/rateLimit';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');

  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (origin && allowedOrigin !== origin) return corsJson(req, 403, { error: 'Forbidden' });

  const limited = await withRateLimit(req, allowedOrigin, { keyPrefix: 'admin-quest-review', limit: 60, windowSeconds: 60 });
  if (limited) return limited;

  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const okRole = requireAdminRole(ctx, 'editor');
  if (!okRole.ok) return corsJson(req, okRole.status, { error: okRole.error });

  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const body = await readJson(req).catch(() => null);
  const progressId = typeof (body as { progressId?: unknown })?.progressId === 'string' ? (body as { progressId: string }).progressId.trim() : '';
  const decision = typeof (body as { decision?: unknown })?.decision === 'string' ? (body as { decision: string }).decision.trim() : '';
  if (!progressId || (decision !== 'approve' && decision !== 'reject')) return corsJson(req, 400, { error: 'Invalid request' });

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
  if (row.status !== 'pending_review') return corsJson(req, 409, { error: 'Not pending' });

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
    await writeAdminAudit(req, ctx, 'QUEST_REVIEWED', 'user_quest_progress', row.id, {
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

  await writeAdminAudit(req, ctx, 'QUEST_REVIEWED', 'user_quest_progress', row.id, {
    decision: 'approve',
    questId: row.questId,
    userId: row.userId,
    awarded: result.awarded,
  });
  return corsJson(req, 200, { ok: true, approved: true, awarded: result.awarded });
}
