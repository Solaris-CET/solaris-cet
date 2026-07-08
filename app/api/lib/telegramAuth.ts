import crypto from 'node:crypto';

export const TELEGRAM_AUTH_MAX_SKEW_SECONDS = 24 * 60 * 60;
export const TELEGRAM_AUTH_MAX_USERNAME_LENGTH = 64;

function sha256(input: string): Buffer {
  return crypto.createHash('sha256').update(input).digest();
}

function hmacSha256Hex(key: Buffer, data: string): string {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

function timingSafeEqHex(a: string, b: string): boolean {
  const aa = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

export function envTelegramBotToken(): string {
  return String(process.env.TELEGRAM_BOT_TOKEN ?? '').trim();
}

export function cleanTelegramPayload(body: unknown): Record<string, string> | null {
  const payload = (typeof body === 'object' && body !== null ? body : null) as Record<string, unknown> | null;
  if (!payload) return null;
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (typeof v === 'string' || typeof v === 'number') clean[k] = String(v);
  }
  return clean;
}

export type TelegramWidgetVerifyResult =
  | { ok: true; telegramUserId: string; username: string | null }
  | { ok: false; error: string };

export function verifyTelegramWidget(payload: Record<string, string>, botToken: string): TelegramWidgetVerifyResult {
  const hash = (payload.hash ?? '').trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(hash)) return { ok: false, error: 'Invalid hash' };

  const id = (payload.id ?? '').trim();
  if (!/^\d{4,20}$/.test(id)) return { ok: false, error: 'Invalid id' };

  const authDateRaw = (payload.auth_date ?? '').trim();
  const authDate = Number.parseInt(authDateRaw, 10);
  if (!Number.isFinite(authDate) || authDate <= 0) return { ok: false, error: 'Invalid auth_date' };
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - authDate) > TELEGRAM_AUTH_MAX_SKEW_SECONDS) return { ok: false, error: 'Expired' };

  const dataCheckString = Object.entries(payload)
    .filter(([k]) => k !== 'hash')
    .map(([k, v]) => [k, String(v ?? '')] as const)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = sha256(botToken);
  const expected = hmacSha256Hex(secretKey, dataCheckString);
  if (!timingSafeEqHex(expected, hash)) return { ok: false, error: 'Invalid signature' };

  const usernameRaw = (payload.username ?? '').trim();
  const username = usernameRaw ? usernameRaw.slice(0, TELEGRAM_AUTH_MAX_USERNAME_LENGTH) : null;
  return { ok: true, telegramUserId: id, username };
}