import { eq } from 'drizzle-orm';

import { getDb, schema } from '../../../../db/client';
import { requireUser } from '../../../lib/authUser';
import { corsJson, corsOptions, readJson } from '../../../lib/http';
import { bootstrapGamification } from '../../lib/gamification';

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
  if (!questSlug || !proofUrl) return corsJson(req, 400, { error: 'Invalid request' });

  const db = getDb();
  await bootstrapGamification(db);

  const [quest] = await db
    .select({ id: schema.quests.id, targetCount: schema.quests.targetCount, requiresProof: schema.quests.requiresProof, active: schema.quests.active })
    .from(schema.quests)
    .where(eq(schema.quests.slug, questSlug))
    .limit(1);
  if (!quest || !quest.active) return corsJson(req, 404, { error: 'Quest not found' });
  if (!quest.requiresProof) return corsJson(req, 400, { error: 'Proof not required' });

  await db
    .insert(schema.userQuestProgress)
    .values({
      userId: user.id,
      questId: quest.id,
      day: '',
      progress: quest.targetCount ?? 1,
      status: 'pending_review',
      proofUrl,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [schema.userQuestProgress.userId, schema.userQuestProgress.questId, schema.userQuestProgress.day],
      set: { progress: quest.targetCount ?? 1, status: 'pending_review', proofUrl, completedAt: new Date(), updatedAt: new Date() },
    });

  return corsJson(req, 200, { ok: true, pendingReview: true });
}
