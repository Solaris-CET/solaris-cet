import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireAuth } from '@/api/lib/auth';
import { AUTH_TELEGRAM_LINK_PROBE } from '@/api/lib/authTelegramLink';
import { jsonResponse, optionsResponse } from '@/api/lib/http';
import { ensureAllowedOrigin } from '@/api/lib/originGuard';
import { cleanTelegramPayload, envTelegramBotToken, verifyTelegramWidget } from '@/api/lib/telegramAuth';

export { AUTH_TELEGRAM_LINK_PATH, AUTH_TELEGRAM_LINK_PROBE } from '@/api/lib/authTelegramLink';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const guard = ensureAllowedOrigin(req);
  if (guard instanceof Response) return guard;

  if (req.method === 'OPTIONS') {
    return optionsResponse(req, AUTH_TELEGRAM_LINK_PROBE.methods.join(', '), 'Content-Type, Authorization');
  }
  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  }

  const botToken = envTelegramBotToken();
  if (!botToken) return jsonResponse(req, { error: 'Not configured' }, AUTH_TELEGRAM_LINK_PROBE.notConfiguredStatus);

  const ctx = await requireAuth(req);
  if ('error' in ctx) return jsonResponse(req, { error: ctx.error }, ctx.status);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: AUTH_TELEGRAM_LINK_PROBE.invalidJsonError }, 400);
  }

  const clean = cleanTelegramPayload(body);
  if (!clean) return jsonResponse(req, { error: AUTH_TELEGRAM_LINK_PROBE.invalidPayloadError }, 400);

  const verified = verifyTelegramWidget(clean, botToken);
  if (!verified.ok) return jsonResponse(req, { error: verified.error }, 401);

  const db = getDb();
  const [existing] = await db
    .select()
    .from(schema.telegramLoginIdentities)
    .where(eq(schema.telegramLoginIdentities.telegramUserId, verified.telegramUserId))
    .limit(1);
  if (existing && existing.userId !== ctx.user.id) {
    return jsonResponse(req, { error: 'Already linked' }, AUTH_TELEGRAM_LINK_PROBE.alreadyLinkedStatus);
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