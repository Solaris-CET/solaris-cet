import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { requireAuth } from '../../lib/auth';
import { jsonResponse, optionsResponse } from '../../lib/http';
import { ensureAllowedOrigin } from '../../lib/originGuard';

export const config = { runtime: 'nodejs' };

type IdentityResponse = {
  ok: true;
  telegramLogin: { telegramUserId: string; username: string | null; linkedAt: string } | null;
  oauth: Array<{ provider: string; providerUserId: string; username: string | null; linkedAt: string }>;
};

export default async function handler(req: Request): Promise<Response> {
  const guard = ensureAllowedOrigin(req);
  if (guard instanceof Response) return guard;

  if (req.method === 'OPTIONS') {
    return optionsResponse(req, 'GET, DELETE, OPTIONS', 'Content-Type, Authorization');
  }

  const ctx = await requireAuth(req);
  if ('error' in ctx) return jsonResponse(req, { error: ctx.error }, ctx.status);

  const db = getDb();

  if (req.method === 'GET') {
    const [tg] = await db.select().from(schema.telegramLoginIdentities).where(eq(schema.telegramLoginIdentities.userId, ctx.user.id)).limit(1);
    const oauth = await db
      .select()
      .from(schema.oauthIdentities)
      .where(eq(schema.oauthIdentities.userId, ctx.user.id));

    const payload: IdentityResponse = {
      ok: true,
      telegramLogin: tg
        ? { telegramUserId: tg.telegramUserId, username: tg.username ?? null, linkedAt: tg.linkedAt.toISOString() }
        : null,
      oauth: oauth.map((o) => ({
        provider: o.provider,
        providerUserId: o.providerUserId,
        username: o.username ?? null,
        linkedAt: o.linkedAt.toISOString(),
      })),
    };
    return jsonResponse(req, payload);
  }

  if (req.method === 'DELETE') {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      body = null;
    }
    const type =
      typeof body === 'object' && body !== null && 'type' in body && typeof (body as { type?: unknown }).type === 'string'
        ? (body as { type: string }).type.trim()
        : '';
    const provider =
      typeof body === 'object' && body !== null && 'provider' in body && typeof (body as { provider?: unknown }).provider === 'string'
        ? (body as { provider: string }).provider.trim().toLowerCase().slice(0, 24)
        : '';

    if (type === 'telegram') {
      await db.delete(schema.telegramLoginIdentities).where(eq(schema.telegramLoginIdentities.userId, ctx.user.id));
    } else if (type === 'oauth') {
      if (!provider) return jsonResponse(req, { error: 'Missing provider' }, 400);
      await db
        .delete(schema.oauthIdentities)
        .where(and(eq(schema.oauthIdentities.userId, ctx.user.id), eq(schema.oauthIdentities.provider, provider)));
    } else {
      return jsonResponse(req, { error: 'Invalid type' }, 400);
    }

    const bot = String(process.env.TELEGRAM_BOT_TOKEN ?? '').trim();
    if (bot) {
      try {
        const [settings] = await db.select().from(schema.userSettings).where(eq(schema.userSettings.userId, ctx.user.id)).limit(1);
        if (!settings || settings.telegramNotificationsEnabled) {
          const [tgLink] = await db.select().from(schema.telegramLinks).where(eq(schema.telegramLinks.userId, ctx.user.id)).limit(1);
          const chatId = tgLink?.chatId ? Number.parseInt(String(tgLink.chatId), 10) : Number.NaN;
          if (tgLink && Number.isFinite(chatId)) {
            const { telegramSendMessage } = await import('../../telegram/lib');
            const label = type === 'telegram' ? 'Telegram Login' : `OAuth (${provider})`;
            await telegramSendMessage(bot, chatId, `Identitate eliminată: ${label}`);
          }
        }
      } catch {
        void 0;
      }
    }

    return jsonResponse(req, { ok: true });
  }

  return jsonResponse(req, { error: 'Method not allowed' }, 405);
}

