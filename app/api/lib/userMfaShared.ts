import { eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { telegramSendMessage } from '../telegram/lib';
import { decryptApiKeyWithEnvSecrets } from './crypto';
import { verifyTotpCode } from './totp';

export const MFA_TOTP_CODE_REGEX = /^\d{6}$/;
export const MFA_TOTP_WINDOW = 1;
export const MFA_HEADER_NAME = 'x-mfa-code' as const;

export function parseMfaTotpPostCode(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  const code = (body as { code?: unknown }).code;
  return typeof code === 'string' ? code.trim() : '';
}

export function parseMfaTotpHeaderCode(req: Request): string {
  return (req.headers.get(MFA_HEADER_NAME) ?? '').trim();
}

export function isValidMfaTotpCode(code: string): boolean {
  return MFA_TOTP_CODE_REGEX.test(code);
}

export type UserMfaGateResult = { ok: true } | { ok: false; status: number; error: string };

export async function verifyUserMfaGate(req: Request, userId: string): Promise<UserMfaGateResult> {
  const code = parseMfaTotpHeaderCode(req);
  if (!isValidMfaTotpCode(code)) return { ok: false, status: 401, error: 'MFA required' };

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

  const ok = verifyTotpCode(secret, code, Date.now(), MFA_TOTP_WINDOW);
  if (!ok) return { ok: false, status: 401, error: 'MFA invalid' };
  return { ok: true };
}

export async function notifyUserSecurityTelegram(userId: string, message: string): Promise<void> {
  const token = String(process.env.TELEGRAM_BOT_TOKEN ?? '').trim();
  if (!token) return;

  const db = getDb();
  const [settings] = await db.select().from(schema.userSettings).where(eq(schema.userSettings.userId, userId)).limit(1);
  if (settings && !settings.telegramNotificationsEnabled) return;

  const [tg] = await db.select().from(schema.telegramLinks).where(eq(schema.telegramLinks.userId, userId)).limit(1);
  const chatId = tg?.chatId ? Number.parseInt(String(tg.chatId), 10) : Number.NaN;
  if (!tg || !Number.isFinite(chatId)) return;

  await telegramSendMessage(token, chatId, message);
}