import { and, eq, inArray } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireAuth } from '@/api/lib/auth';
import { jsonResponse, optionsResponse } from '@/api/lib/http';
import { ensureAllowedOrigin } from '@/api/lib/originGuard';
import {
  buildWalletsListResponse,
  buildWalletsUnlinkTelegramMessage,
  mergeUserWallets,
  parseWalletsDeleteAddress,
  validateWalletsDelete,
  WALLETS_PROBE,
} from '../lib/wallets';

export { WALLETS_PATH, WALLETS_PROBE } from '@/api/lib/wallets';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const guard = ensureAllowedOrigin(req);
  if (guard instanceof Response) return guard;

  if (req.method === 'OPTIONS') {
    return optionsResponse(req, WALLETS_PROBE.methods.join(', '), WALLETS_PROBE.allowHeaders);
  }

  const ctx = await requireAuth(req);
  if ('error' in ctx) return jsonResponse(req, { error: ctx.error }, ctx.status);

  const db = getDb();
  const primary = ctx.user.walletAddress;

  if (req.method === 'GET') {
    const rows = await db.select().from(schema.userTonWallets).where(eq(schema.userTonWallets.userId, ctx.user.id));
    const wallets = mergeUserWallets(primary, rows);
    return jsonResponse(req, buildWalletsListResponse(wallets));
  }

  if (req.method === 'DELETE') {
    const address = parseWalletsDeleteAddress(new URL(req.url));
    const validation = validateWalletsDelete(address, primary);
    if (!validation.ok) return jsonResponse(req, { error: validation.error }, validation.status);

    await db
      .delete(schema.userTonWallets)
      .where(and(eq(schema.userTonWallets.userId, ctx.user.id), eq(schema.userTonWallets.address, validation.address)));

    const token = String(process.env.TELEGRAM_BOT_TOKEN ?? '').trim();
    if (token) {
      try {
        const [settings] = await db.select().from(schema.userSettings).where(eq(schema.userSettings.userId, ctx.user.id)).limit(1);
        if (!settings || settings.telegramNotificationsEnabled) {
          const [tg] = await db.select().from(schema.telegramLinks).where(eq(schema.telegramLinks.userId, ctx.user.id)).limit(1);
          const chatId = tg?.chatId ? Number.parseInt(String(tg.chatId), 10) : Number.NaN;
          if (tg && Number.isFinite(chatId)) {
            const { telegramSendMessage } = await import('../telegram/lib');
            await telegramSendMessage(token, chatId, buildWalletsUnlinkTelegramMessage(validation.address));
          }
        }
      } catch {
        void 0;
      }
    }

    const left = await db.select().from(schema.userTonWallets).where(eq(schema.userTonWallets.userId, ctx.user.id));
    const addresses = left.map((r) => r.address);
    if (addresses.length) {
      await db
        .update(schema.userTonWallets)
        .set({ isPrimary: false, updatedAt: new Date() })
        .where(and(eq(schema.userTonWallets.userId, ctx.user.id), inArray(schema.userTonWallets.address, addresses)));
    }
    return jsonResponse(req, { ok: true });
  }

  return jsonResponse(req, { error: 'Method not allowed' }, 405);
}