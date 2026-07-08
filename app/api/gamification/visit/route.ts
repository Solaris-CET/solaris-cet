import { getDb } from '@/db/client';
import { requireUser } from '@/api/lib/authUser';
import { GAMIFICATION_VISIT_PROBE } from '@/api/lib/gamificationVisit';
import { corsJson, corsOptions } from '@/api/lib/http';
import { awardPoints } from '@/api/lib/points';
import { todayKeyUtc } from '@/api/gamification/lib/gamification';

export { GAMIFICATION_VISIT_PATH, GAMIFICATION_VISIT_PROBE } from '@/api/lib/gamificationVisit';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, GAMIFICATION_VISIT_PROBE.methods.join(', '));
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const user = await requireUser(req);
  if (!user) return corsJson(req, GAMIFICATION_VISIT_PROBE.unauthenticatedStatus, { error: 'Unauthorized' });

  const db = getDb();
  const day = todayKeyUtc();
  const { awarded } = await awardPoints(db, user.id, GAMIFICATION_VISIT_PROBE.visitPoints, GAMIFICATION_VISIT_PROBE.visitReason, {
    dedupeKey: `visit:${day}`,
    meta: { activity: 'visit', day },
  });
  return corsJson(req, 200, { ok: true, awarded });
}