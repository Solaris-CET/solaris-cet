import { eq, sql } from 'drizzle-orm';

import { getDb, schema } from '../../db/client';
import { requireAuth } from '../lib/auth';
import { getAllowedOrigin } from '../lib/cors';
import { jsonResponse, optionsResponse } from '../lib/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const allowedOrigin = getAllowedOrigin(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return optionsResponse(req, 'GET, OPTIONS', 'Content-Type, Authorization');
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

  const referralsCount = typeof refCount?.c === 'number' ? refCount.c : 0;

  return jsonResponse(req, {
    user: {
      id: ctx.user.id,
      walletAddress: ctx.user.walletAddress,
      role: ctx.user.role,
      points: ctx.user.points,
      referralCode: ctx.user.referralCode,
      createdAt: ctx.user.createdAt,
    },
    settings: {
      displayName: settings?.displayName ?? null,
      email: settings?.email ?? null,
      emailRemindersEnabled: settings?.emailRemindersEnabled ?? false,
      telegramNotificationsEnabled: settings?.telegramNotificationsEnabled ?? true,
      locale: settings?.locale ?? 'ro',
      theme: settings?.theme ?? 'dark',
    },
    telegram: tg
      ? { linked: true, username: tg.username ?? null, chatId: tg.chatId }
      : { linked: false, username: null, chatId: null },
    stats: {
      referralsCount,
      mfaEnabled: ctx.mfaEnabled,
    },
  });
}
