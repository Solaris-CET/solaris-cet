import { and, desc, eq } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { requireUser } from '../../lib/authUser';
import { corsJson, corsOptions } from '../../lib/http';
import { tonAddressSchema } from '../../lib/validation';
import { levelProgressFromXp } from '../lib/gamification';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const viewer = await requireUser(req);
  if (!viewer) return corsJson(req, 401, { error: 'Unauthorized' });

  const url = new URL(req.url);
  const walletRaw = (url.searchParams.get('wallet') ?? '').trim();
  const parsed = tonAddressSchema.safeParse(walletRaw);
  if (!parsed.success) return corsJson(req, 400, { error: 'Invalid wallet' });
  const walletAddress = parsed.data.toString();

  const db = getDb();
  const [u] = await db
    .select({ id: schema.users.id, walletAddress: schema.users.walletAddress, points: schema.users.points })
    .from(schema.users)
    .where(eq(schema.users.walletAddress, walletAddress))
    .limit(1);
  if (!u) return corsJson(req, 404, { error: 'Not found' });

  const badges = await db
    .select({
      slug: schema.badges.slug,
      title: schema.badges.title,
      rarity: schema.badges.rarity,
      awardedAt: schema.userBadges.awardedAt,
    })
    .from(schema.userBadges)
    .innerJoin(schema.badges, eq(schema.userBadges.badgeId, schema.badges.id))
    .where(and(eq(schema.userBadges.userId, u.id), eq(schema.badges.active, true)))
    .orderBy(desc(schema.userBadges.awardedAt))
    .limit(50);

  const lp = levelProgressFromXp(u.points ?? 0);
  return corsJson(req, 200, {
    ok: true,
    profile: {
      walletAddress: u.walletAddress,
      xp: u.points ?? 0,
      level: lp.level,
      levelProgress: lp,
      badges: badges.map((b) => ({ slug: b.slug, title: b.title, rarity: b.rarity, awardedAt: b.awardedAt.toISOString() })),
    },
  });
}
