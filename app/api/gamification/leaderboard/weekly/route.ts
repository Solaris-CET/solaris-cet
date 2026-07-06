import { and, desc, gte, lt, sql } from 'drizzle-orm';

import { getDb, schema } from '../../../../db/client';
import { corsJson, corsOptions } from '../../../lib/http';

export const config = { runtime: 'nodejs' };

function startOfWeekUtc(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay();
  const delta = (day + 6) % 7;
  x.setUTCDate(x.getUTCDate() - delta);
  return x;
}

function dayKeyUtc(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const db = getDb();
  const now = new Date();
  const start = startOfWeekUtc(now);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      userId: schema.pointsLedger.userId,
      xp: sql<number>`sum(${schema.pointsLedger.delta})`,
    })
    .from(schema.pointsLedger)
    .where(and(gte(schema.pointsLedger.createdAt, start), lt(schema.pointsLedger.createdAt, end)))
    .groupBy(schema.pointsLedger.userId)
    .orderBy(desc(sql<number>`sum(${schema.pointsLedger.delta})`))
    .limit(50);

  const userIds = rows.map((r) => r.userId);
  const users =
    userIds.length === 0
      ? []
      : await db
          .select({ id: schema.users.id, walletAddress: schema.users.walletAddress, points: schema.users.points })
          .from(schema.users)
          .where(sql`${schema.users.id} = any(${userIds})`)
          .limit(60);
  const byId = new Map(users.map((u) => [u.id, u]));

  return corsJson(req, 200, {
    ok: true,
    weekStart: dayKeyUtc(start),
    weekEnd: dayKeyUtc(new Date(end.getTime() - 24 * 60 * 60 * 1000)),
    items: rows.map((r, i) => {
      const u = byId.get(r.userId);
      return {
        rank: i + 1,
        walletAddress: u?.walletAddress ?? null,
        xpEarned: Number(r.xp ?? 0),
        totalXp: u?.points ?? null,
      };
    }),
  });
}
