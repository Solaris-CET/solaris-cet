import { and, eq, gte, inArray, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { getDb, schema } from '../../../../db/client';
import { requireUser } from '../../../lib/authUser';
import { corsJson, corsOptions } from '../../../lib/http';
import { bootstrapGamification, todayKeyUtc } from '../../lib/gamification';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, POST, OPTIONS');
  const user = await requireUser(req);
  if (!user) return corsJson(req, 401, { error: 'Unauthorized' });

  const db = getDb();
  await bootstrapGamification(db);

  if (req.method === 'GET') {
    const links = await db
      .select({ id: schema.affiliateLinks.id, code: schema.affiliateLinks.code, active: schema.affiliateLinks.active, createdAt: schema.affiliateLinks.createdAt })
      .from(schema.affiliateLinks)
      .where(eq(schema.affiliateLinks.userId, user.id))
      .limit(50);

    const linkIds = links.map((l) => l.id);
    const codes = links.map((l) => l.code);
    const now = new Date();
    const day7 = todayKeyUtc(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));

    const clicks =
      linkIds.length === 0
        ? []
        : await db
            .select({ affiliateLinkId: schema.affiliateClicksDaily.affiliateLinkId, clicks: sql<number>`sum(${schema.affiliateClicksDaily.count})` })
            .from(schema.affiliateClicksDaily)
            .where(and(inArray(schema.affiliateClicksDaily.affiliateLinkId, linkIds), gte(schema.affiliateClicksDaily.day, day7)))
            .groupBy(schema.affiliateClicksDaily.affiliateLinkId);
    const clicksById = new Map<string, number>();
    for (const c of clicks) clicksById.set(c.affiliateLinkId, Number(c.clicks ?? 0));

    const signups =
      codes.length === 0
        ? []
        : await db
            .select({ code: schema.referrals.codeUsed, signups: sql<number>`count(*)` })
            .from(schema.referrals)
            .where(and(eq(schema.referrals.referrerUserId, user.id), inArray(schema.referrals.codeUsed, codes)))
            .groupBy(schema.referrals.codeUsed);
    const signupsByCode = new Map<string, number>();
    for (const s of signups) signupsByCode.set(s.code, Number(s.signups ?? 0));

    return corsJson(req, 200, {
      ok: true,
      links: links.map((l) => ({
        code: l.code,
        active: l.active,
        createdAt: l.createdAt.toISOString(),
        clicks7d: clicksById.get(l.id) ?? 0,
        signups: signupsByCode.get(l.code) ?? 0,
      })),
    });
  }

  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const maxAttempts = 6;
  for (let i = 0; i < maxAttempts; i += 1) {
    const code = nanoid(10).toUpperCase();
    try {
      await db.insert(schema.affiliateLinks).values({ userId: user.id, code, active: true });
      return corsJson(req, 200, { ok: true, code });
    } catch (err) {
      const e = err as { code?: string };
      if (e?.code === '23505') continue;
      throw err;
    }
  }

  return corsJson(req, 500, { error: 'Could not generate code' });
}
