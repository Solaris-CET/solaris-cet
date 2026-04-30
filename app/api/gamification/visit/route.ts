import { getDb } from '../../../db/client';
import { requireUser } from '../../lib/authUser';
import { corsJson, corsOptions } from '../../lib/http';
import { awardPoints } from '../../lib/points';
import { todayKeyUtc } from '../lib/gamification';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const user = await requireUser(req);
  if (!user) return corsJson(req, 401, { error: 'Unauthorized' });

  const db = getDb();
  const day = todayKeyUtc();
  const { awarded } = await awardPoints(db, user.id, 1, 'visit', { dedupeKey: `visit:${day}`, meta: { activity: 'visit', day } });
  return corsJson(req, 200, { ok: true, awarded });
}

