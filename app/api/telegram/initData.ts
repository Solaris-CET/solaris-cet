import { hmacSha256, hmacSha256Hex, timingSafeEqualHex } from '../lib/nodeCrypto';

type TelegramWebAppUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
};

export type TelegramInitDataVerified = {
  ok: true;
  authDate: number;
  user: TelegramWebAppUser | null;
};

export type TelegramInitDataRejected = {
  ok: false;
  error: string;
};

function parseInitData(initData: string): URLSearchParams {
  const trimmed = initData.trim();
  const qs = trimmed.includes('=') ? trimmed : '';
  return new URLSearchParams(qs);
}

function dataCheckString(params: URLSearchParams): { check: string; hash: string | null } {
  const hash = params.get('hash');
  const pairs: Array<[string, string]> = [];
  params.forEach((v, k) => {
    if (k === 'hash') return;
    pairs.push([k, v]);
  });
  pairs.sort((a, b) => a[0].localeCompare(b[0]));
  const check = pairs.map(([k, v]) => `${k}=${v}`).join('\n');
  return { check, hash };
}

function parseAuthDate(params: URLSearchParams): number | null {
  const raw = params.get('auth_date');
  const n = raw ? Number(raw) : NaN;
  if (!Number.isFinite(n)) return null;
  const int = Math.floor(n);
  if (int <= 0) return null;
  return int;
}

function parseUser(params: URLSearchParams): TelegramWebAppUser | null {
  const raw = params.get('user');
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw) as unknown;
    if (!obj || typeof obj !== 'object') return null;
    const id = (obj as { id?: unknown }).id;
    if (typeof id !== 'number' || !Number.isFinite(id)) return null;
    const username = (obj as { username?: unknown }).username;
    const first = (obj as { first_name?: unknown }).first_name;
    const last = (obj as { last_name?: unknown }).last_name;
    return {
      id: Math.floor(id),
      username: typeof username === 'string' ? username : undefined,
      first_name: typeof first === 'string' ? first : undefined,
      last_name: typeof last === 'string' ? last : undefined,
    };
  } catch {
    return null;
  }
}

export function verifyTelegramInitData(
  initData: string,
  botToken: string,
  opts?: { nowMs?: number; maxAgeSeconds?: number },
): TelegramInitDataVerified | TelegramInitDataRejected {
  const token = botToken.trim();
  if (!token) return { ok: false, error: 'not_configured' };

  const params = parseInitData(initData);
  const authDate = parseAuthDate(params);
  if (!authDate) return { ok: false, error: 'missing_auth_date' };

  const { check, hash } = dataCheckString(params);
  if (!hash) return { ok: false, error: 'missing_hash' };
  if (!check) return { ok: false, error: 'empty_payload' };

  const nowMs = opts?.nowMs ?? Date.now();
  const maxAgeSeconds = opts?.maxAgeSeconds ?? 24 * 60 * 60;
  const ageSeconds = Math.floor(nowMs / 1000) - authDate;
  if (!Number.isFinite(ageSeconds) || ageSeconds < -60 || ageSeconds > maxAgeSeconds) {
    return { ok: false, error: 'expired' };
  }

  const secretKey = hmacSha256('WebAppData', token);
  const computed = hmacSha256Hex(secretKey, check);
  if (!timingSafeEqualHex(computed, hash)) return { ok: false, error: 'bad_signature' };

  return { ok: true, authDate, user: parseUser(params) };
}

