import { and, eq, isNull, ne } from 'drizzle-orm';

import { getDb, schema } from '../../../../db/client';
import { requireAuth } from '../../../lib/auth';
import { decryptApiKeyWithEnvSecrets } from '../../../lib/crypto';
import { corsJson, optionsResponse } from '../../../lib/http';
import { verifyTotpCode } from '../../../lib/totp';
import { telegramSendMessage } from '../../../telegram/lib';

export const config = { runtime: 'nodejs' };

async function requireUserMfa(req: Request, userId: string): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const code = (req.headers.get('x-mfa-code') ?? '').trim();
  if (!/^\d{6}$/.test(code)) return { ok: false, status: 401, error: 'MFA required' };
  const db = getDb();
  const [mfa] = await db.select().from(schema.userMfa).where(eq(schema.userMfa.userId, userId)).limit(1);
  if (!mfa?.enabledAt) return { ok: false, status: 412, error: 'MFA required' };
  const blob = (mfa.secretEncrypted ?? '').trim();
  if (!blob) return { ok: false, status: 412, error: 'MFA required' };
  let secret: string;
  try {
    secret = await decryptApiKeyWithEnvSecrets(blob);
  } catch {
    return { ok: false, status: 501, error: 'Not configured' };
  }
  const ok = verifyTotpCode(secret, code, Date.now(), 1);
  if (!ok) return { ok: false, status: 401, error: 'MFA invalid' };
  return { ok: true };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsResponse(req, 'POST, OPTIONS', 'Content-Type, Authorization, X-MFA-Code');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const ctx = await requireAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  if (!ctx.sid) return corsJson(req, 400, { error: 'Session id missing' });

  if (ctx.mfaEnabled) {
    const gate = await requireUserMfa(req, ctx.user.id);
    if (!gate.ok) return corsJson(req, gate.status, { error: gate.error });
  }

  const db = getDb();
  const res = await db
    .update(schema.sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(schema.sessions.userId, ctx.user.id), ne(schema.sessions.id, ctx.sid), isNull(schema.sessions.revokedAt)))
    .returning({ id: schema.sessions.id });

  if (res.length > 0) {
    try {
      const token = String(process.env.TELEGRAM_BOT_TOKEN ?? '').trim();
      if (token) {
        const [settings] = await db.select().from(schema.userSettings).where(eq(schema.userSettings.userId, ctx.user.id)).limit(1);
        if (!settings || settings.telegramNotificationsEnabled) {
          const [tg] = await db.select().from(schema.telegramLinks).where(eq(schema.telegramLinks.userId, ctx.user.id)).limit(1);
          const chatId = tg?.chatId ? Number.parseInt(String(tg.chatId), 10) : Number.NaN;
          if (tg && Number.isFinite(chatId)) {
            await telegramSendMessage(token, chatId, `Au fost revocate ${res.length} sesiuni.`);
          }
        }
      }
    } catch {
      void 0;
    }
  }

  return corsJson(req, 200, { ok: true, revokedCount: res.length });
}
