import crypto from 'node:crypto';

import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '../../../../db/client';
import { requireAuth } from '../../../lib/auth';
import { jsonResponse, optionsResponse } from '../../../lib/http';
import { ensureAllowedOrigin } from '../../../lib/originGuard';

export const config = { runtime: 'nodejs' };

function env(name: string): string {
  return String(process.env[name] ?? '').trim();
}

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

function verifyTelegramWidget(payload: Record<string, string>, botToken: string): { ok: true; telegramUserId: string; username: string | null } | { ok: false; error: string } {
  const hash = (payload.hash ?? '').trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(hash)) return { ok: false, error: 'Invalid hash' };

  const id = (payload.id ?? '').trim();
  if (!/^\d{4,20}$/.test(id)) return { ok: false, error: 'Invalid id' };

  const authDateRaw = (payload.auth_date ?? '').trim();
  const authDate = Number.parseInt(authDateRaw, 10);
  if (!Number.isFinite(authDate) || authDate <= 0) return { ok: false, error: 'Invalid auth_date' };
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - authDate) > 24 * 60 * 60) return { ok: false, error: 'Expired' };

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
  const username = usernameRaw ? usernameRaw.slice(0, 64) : null;
  return { ok: true, telegramUserId: id, username };
}

export default async function handler(req: Request): Promise<Response> {
  const guard = ensureAllowedOrigin(req);
  if (guard instanceof Response) return guard;

  if (req.method === 'OPTIONS') {
    return optionsResponse(req, 'POST, OPTIONS', 'Content-Type, Authorization');
  }
  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  }

  const botToken = env('TELEGRAM_BOT_TOKEN');
  if (!botToken) return jsonResponse(req, { error: 'Not configured' }, 501);

  const ctx = await requireAuth(req);
  if ('error' in ctx) return jsonResponse(req, { error: ctx.error }, ctx.status);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: 'Invalid JSON body' }, 400);
  }

  const payload = (typeof body === 'object' && body !== null ? body : null) as Record<string, unknown> | null;
  if (!payload) return jsonResponse(req, { error: 'Invalid payload' }, 400);

  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (typeof v === 'string' || typeof v === 'number') clean[k] = String(v);
  }

  const verified = verifyTelegramWidget(clean, botToken);
  if (!verified.ok) return jsonResponse(req, { error: verified.error }, 401);

  const db = getDb();
  const [existing] = await db
    .select()
    .from(schema.telegramLoginIdentities)
    .where(eq(schema.telegramLoginIdentities.telegramUserId, verified.telegramUserId))
    .limit(1);
  if (existing && existing.userId !== ctx.user.id) {
    return jsonResponse(req, { error: 'Already linked' }, 409);
  }

  await db
    .insert(schema.telegramLoginIdentities)
    .values({ userId: ctx.user.id, telegramUserId: verified.telegramUserId, username: verified.username })
    .onConflictDoUpdate({
      target: schema.telegramLoginIdentities.userId,
      set: { telegramUserId: verified.telegramUserId, username: verified.username, linkedAt: new Date() },
      where: and(eq(schema.telegramLoginIdentities.userId, ctx.user.id)),
    });

  return jsonResponse(req, { ok: true });
}

