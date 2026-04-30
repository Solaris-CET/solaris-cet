import { and, eq, inArray } from 'drizzle-orm';

import { getDb, schema } from '../../db/client';
import { requireAuth } from '../lib/auth';
import { jsonResponse, optionsResponse } from '../lib/http';
import { ensureAllowedOrigin } from '../lib/originGuard';

export const config = { runtime: 'nodejs' };

type WalletRow = {
  address: string;
  label: string | null;
  isPrimary: boolean;
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
  const primary = ctx.user.walletAddress;

  if (req.method === 'GET') {
    const rows = await db.select().from(schema.userTonWallets).where(eq(schema.userTonWallets.userId, ctx.user.id));
    const wallets: WalletRow[] = [];

    const hasPrimaryInTable = rows.some((r) => r.address === primary);
    if (!hasPrimaryInTable) {
      wallets.push({ address: primary, label: null, isPrimary: true });
    }
    for (const r of rows) {
      wallets.push({ address: r.address, label: r.label ?? null, isPrimary: r.address === primary || Boolean(r.isPrimary) });
    }

    const uniq = new Map<string, WalletRow>();
    for (const w of wallets) {
      const prev = uniq.get(w.address);
      if (!prev) uniq.set(w.address, w);
      else uniq.set(w.address, { ...prev, ...w, isPrimary: prev.isPrimary || w.isPrimary });
    }
    return jsonResponse(req, { ok: true, wallets: Array.from(uniq.values()) });
  }

  if (req.method === 'DELETE') {
    const url = new URL(req.url);
    const address = (url.searchParams.get('address') ?? '').trim();
    if (!address) return jsonResponse(req, { error: 'Missing address' }, 400);
    if (address === primary) return jsonResponse(req, { error: 'Cannot unlink primary wallet' }, 409);

    await db
      .delete(schema.userTonWallets)
      .where(and(eq(schema.userTonWallets.userId, ctx.user.id), eq(schema.userTonWallets.address, address)));

    const token = String(process.env.TELEGRAM_BOT_TOKEN ?? '').trim();
    if (token) {
      try {
        const [settings] = await db.select().from(schema.userSettings).where(eq(schema.userSettings.userId, ctx.user.id)).limit(1);
        if (!settings || settings.telegramNotificationsEnabled) {
          const [tg] = await db.select().from(schema.telegramLinks).where(eq(schema.telegramLinks.userId, ctx.user.id)).limit(1);
          const chatId = tg?.chatId ? Number.parseInt(String(tg.chatId), 10) : Number.NaN;
          if (tg && Number.isFinite(chatId)) {
            const { telegramSendMessage } = await import('../telegram/lib');
            await telegramSendMessage(token, chatId, `Wallet eliminat: ${address.slice(0, 10)}…`);
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

