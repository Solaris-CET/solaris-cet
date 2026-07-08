import { eq, sql } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireAuth } from '@/api/lib/auth';
import { getAllowedOrigin } from '@/api/lib/cors';
import { jsonResponse, optionsResponse } from '@/api/lib/http';
import { buildUserMePayload, normalizeReferralsCount, USER_ME_PROBE } from '@/api/lib/userMe';

export { USER_ME_PATH, USER_ME_PROBE } from '@/api/lib/userMe';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const allowedOrigin = getAllowedOrigin(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return optionsResponse(req, USER_ME_PROBE.methods.join(', '), 'Content-Type, Authorization');
  }

  if (req.method !== 'GET') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  }

  const ctx = await requireAuth(req);
  if ('error' in ctx) {
    return new Response(JSON.stringify({ error: ctx.error }), {
      status: ctx.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        Vary: 'Origin',
        'Cache-Control': 'no-store',
      },
    });
  }

  const db = getDb();
  const [settings] = await db.select().from(schema.userSettings).where(eq(schema.userSettings.userId, ctx.user.id));
  const [tg] = await db.select().from(schema.telegramLinks).where(eq(schema.telegramLinks.userId, ctx.user.id));
  const [refCount] = await db
    .select({ c: sql<number>`count(*)`.as('c') })
    .from(schema.referrals)
    .where(eq(schema.referrals.referrerUserId, ctx.user.id));

  const payload = buildUserMePayload({
    ctx,
    settings: settings ?? null,
    telegram: tg
      ? { linked: true, username: tg.username ?? null, chatId: tg.chatId }
      : { linked: false, username: null, chatId: null },
    referralsCount: normalizeReferralsCount(refCount?.c),
  });

  return jsonResponse(req, payload);
}