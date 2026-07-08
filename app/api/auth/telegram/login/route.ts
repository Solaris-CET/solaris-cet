import { eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { AUTH_TELEGRAM_LOGIN_PROBE } from '@/api/lib/authTelegramLogin';
import { clientIp } from '@/api/lib/clientIp';
import { jsonResponse, optionsResponse } from '@/api/lib/http';
import { getJwtSecretsFromEnv, signJwt } from '@/api/lib/jwt';
import { ensureAllowedOrigin } from '@/api/lib/originGuard';
import { cleanTelegramPayload, envTelegramBotToken, verifyTelegramWidget } from '@/api/lib/telegramAuth';

export { AUTH_TELEGRAM_LOGIN_PATH, AUTH_TELEGRAM_LOGIN_PROBE } from '@/api/lib/authTelegramLogin';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const guard = ensureAllowedOrigin(req);
  if (guard instanceof Response) return guard;

  if (req.method === 'OPTIONS') {
    return optionsResponse(req, AUTH_TELEGRAM_LOGIN_PROBE.methods.join(', '), 'Content-Type, Authorization');
  }
  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  }

  const botToken = envTelegramBotToken();
  if (!botToken) return jsonResponse(req, { error: 'Not configured' }, AUTH_TELEGRAM_LOGIN_PROBE.notConfiguredStatus);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: AUTH_TELEGRAM_LOGIN_PROBE.invalidJsonError }, 400);
  }

  const clean = cleanTelegramPayload(body);
  if (!clean) return jsonResponse(req, { error: AUTH_TELEGRAM_LOGIN_PROBE.invalidPayloadError }, 400);

  const verified = verifyTelegramWidget(clean, botToken);
  if (!verified.ok) return jsonResponse(req, { error: verified.error }, 401);

  const db = getDb();
  const [idRow] = await db
    .select()
    .from(schema.telegramLoginIdentities)
    .where(eq(schema.telegramLoginIdentities.telegramUserId, verified.telegramUserId))
    .limit(1);
  if (!idRow) return jsonResponse(req, { error: 'Not linked' }, AUTH_TELEGRAM_LOGIN_PROBE.notLinkedStatus);

  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, idRow.userId)).limit(1);
  if (!user) return jsonResponse(req, { error: 'Not linked' }, AUTH_TELEGRAM_LOGIN_PROBE.notLinkedStatus);

  const secret = getJwtSecretsFromEnv()[0];
  if (!secret) return jsonResponse(req, { error: 'JWT not configured' }, 500);

  const ttlSeconds = AUTH_TELEGRAM_LOGIN_PROBE.jwtTtlSeconds;
  const [session] = await db
    .insert(schema.sessions)
    .values({
      userId: user.id,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
      ip: clientIp(req),
      userAgent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
    })
    .returning();

  const token = await signJwt({ wallet: user.walletAddress, sid: session.id, sub: user.id }, secret, ttlSeconds);
  return jsonResponse(req, { ok: true, token }, 200);
}