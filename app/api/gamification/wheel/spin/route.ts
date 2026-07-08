import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireUser } from '@/api/lib/authUser';
import { corsJson, corsOptions } from '@/api/lib/http';
import { awardPoints } from '@/api/lib/points';
import { isWheelSpinUniqueViolation, rollWheelReward, WHEEL_SPIN_PROBE } from '@/api/lib/wheelSpin';
import { todayKeyUtc } from '@/api/gamification/lib/gamification';

export { WHEEL_SPIN_PATH, WHEEL_SPIN_PROBE } from '@/api/lib/wheelSpin';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, WHEEL_SPIN_PROBE.methods.join(', '));
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const user = await requireUser(req);
  if (!user) return corsJson(req, WHEEL_SPIN_PROBE.unauthenticatedStatus, { error: 'Unauthorized' });

  const db = getDb();
  const day = todayKeyUtc();

  const [existing] = await db
    .select({ rewardPoints: schema.wheelSpins.rewardPoints, createdAt: schema.wheelSpins.createdAt })
    .from(schema.wheelSpins)
    .where(and(eq(schema.wheelSpins.userId, user.id), eq(schema.wheelSpins.day, day)))
    .limit(1);
  if (existing) {
    return corsJson(req, 200, {
      ok: true,
      spun: true,
      rewardPoints: existing.rewardPoints,
      day,
      createdAt: existing.createdAt.toISOString(),
    });
  }

  const rewardPoints = rollWheelReward();
  const res = await db.transaction(async (tx) => {
    try {
      const [row] = await tx
        .insert(schema.wheelSpins)
        .values({ userId: user.id, day, rewardPoints, meta: null })
        .returning({ createdAt: schema.wheelSpins.createdAt });
      const { awarded } =
        rewardPoints > 0
          ? await awardPoints(tx as unknown as typeof db, user.id, rewardPoints, WHEEL_SPIN_PROBE.wheelReason, {
              dedupeKey: `wheel:${day}`,
              meta: { activity: 'wheel_spin', day, rewardPoints },
            })
          : { awarded: false };
      return { createdAt: row?.createdAt ?? new Date(), awarded };
    } catch (err) {
      if (!isWheelSpinUniqueViolation(err)) throw err;
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