import crypto from 'node:crypto';

import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '../../../../db/client';
import { requireUser } from '../../../lib/authUser';
import { corsJson, corsOptions } from '../../../lib/http';
import { awardPoints } from '../../../lib/points';
import { todayKeyUtc } from '../../lib/gamification';

export const config = { runtime: 'nodejs' };

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === '23505';
}

function rollReward(): number {
  const buckets: Array<{ reward: number; weight: number }> = [
    { reward: 0, weight: 10 },
    { reward: 1, weight: 30 },
    { reward: 2, weight: 25 },
    { reward: 3, weight: 18 },
    { reward: 5, weight: 12 },
    { reward: 10, weight: 5 },
  ];
  const total = buckets.reduce((acc, b) => acc + b.weight, 0);
  const r = crypto.randomInt(0, total);
  let cur = 0;
  for (const b of buckets) {
    cur += b.weight;
    if (r < cur) return b.reward;
  }
  return 0;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const user = await requireUser(req);
  if (!user) return corsJson(req, 401, { error: 'Unauthorized' });

  const db = getDb();
  const day = todayKeyUtc();

  const [existing] = await db
    .select({ rewardPoints: schema.wheelSpins.rewardPoints, createdAt: schema.wheelSpins.createdAt })
    .from(schema.wheelSpins)
    .where(and(eq(schema.wheelSpins.userId, user.id), eq(schema.wheelSpins.day, day)))
    .limit(1);
  if (existing) {
    return corsJson(req, 200, { ok: true, spun: true, rewardPoints: existing.rewardPoints, day, createdAt: existing.createdAt.toISOString() });
  }

  const rewardPoints = rollReward();
  const res = await db.transaction(async (tx) => {
    try {
      const [row] = await tx
        .insert(schema.wheelSpins)
        .values({ userId: user.id, day, rewardPoints, meta: null })
        .returning({ createdAt: schema.wheelSpins.createdAt });
      const { awarded } =
        rewardPoints > 0
          ? await awardPoints(tx as unknown as typeof db, user.id, rewardPoints, 'wheel', {
              dedupeKey: `wheel:${day}`,
              meta: { activity: 'wheel_spin', day, rewardPoints },
            })
          : { awarded: false };
      return { createdAt: row?.createdAt ?? new Date(), awarded };
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      const [row] = await tx
        .select({ rewardPoints: schema.wheelSpins.rewardPoints, createdAt: schema.wheelSpins.createdAt })
        .from(schema.wheelSpins)
        .where(and(eq(schema.wheelSpins.userId, user.id), eq(schema.wheelSpins.day, day)))
        .limit(1);
      return { createdAt: row?.createdAt ?? new Date(), awarded: false };
    }
  });

  return corsJson(req, 200, { ok: true, spun: true, rewardPoints, day, awarded: res.awarded, createdAt: res.createdAt.toISOString() });
}

