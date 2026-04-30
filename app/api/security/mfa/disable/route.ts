import { eq } from 'drizzle-orm';

import { getDb, schema } from '../../../../db/client';
import { requireAuth } from '../../../lib/auth';
import { decryptApiKeyWithEnvSecrets } from '../../../lib/crypto';
import { corsJson, optionsResponse, readJson } from '../../../lib/http';
import { verifyTotpCode } from '../../../lib/totp';
import { telegramSendMessage } from '../../../telegram/lib';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsResponse(req, 'POST, OPTIONS');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const ctx = await requireAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  const body = await readJson(req).catch(() => null);
  const code =
    typeof body === 'object' && body !== null && 'code' in body && typeof (body as { code?: unknown }).code === 'string'
      ? (body as { code: string }).code.trim()
      : '';
  if (!/^\d{6}$/.test(code)) return corsJson(req, 400, { error: 'Invalid code' });

  const db = getDb();
  const [mfa] = await db.select().from(schema.userMfa).where(eq(schema.userMfa.userId, ctx.user.id)).limit(1);
  const enabled = Boolean(mfa?.enabledAt);
  const blob = (mfa?.secretEncrypted ?? '').trim();
  if (!enabled || !blob) return corsJson(req, 412, { error: 'MFA not enabled' });

  let secret: string;
  try {
    secret = await decryptApiKeyWithEnvSecrets(blob);
  } catch {
    return corsJson(req, 501, { error: 'Not configured' });
  }

  const ok = verifyTotpCode(secret, code, Date.now(), 1);
  if (!ok) return corsJson(req, 401, { error: 'MFA invalid' });

  await db
    .update(schema.userMfa)
    .set({ enabledAt: null, secretEncrypted: null, updatedAt: new Date() })
    .where(eq(schema.userMfa.userId, ctx.user.id));

  try {
    const token = String(process.env.TELEGRAM_BOT_TOKEN ?? '').trim();
    if (token) {
      const [settings] = await db.select().from(schema.userSettings).where(eq(schema.userSettings.userId, ctx.user.id)).limit(1);
      if (!settings || settings.telegramNotificationsEnabled) {
        const [tg] = await db.select().from(schema.telegramLinks).where(eq(schema.telegramLinks.userId, ctx.user.id)).limit(1);
        const chatId = tg?.chatId ? Number.parseInt(String(tg.chatId), 10) : Number.NaN;
        if (tg && Number.isFinite(chatId)) {
          await telegramSendMessage(token, chatId, '2FA dezactivat pentru contul tău.');
        }
      }
    }
  } catch {
    void 0;
  }

  return corsJson(req, 200, { ok: true });
}
