import { eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireAdminMfa, requireAuth } from '@/api/lib/auth';
import {
  APP_ADMIN_USERS_ROLE_PROBE,
  parseRoleChangeBody,
} from '../../../lib/appAdminUsersRole';
import { jsonResponse, optionsResponse } from '@/api/lib/http';
import { ensureAllowedOrigin } from '@/api/lib/originGuard';

export { APP_ADMIN_USERS_ROLE_PATH, APP_ADMIN_USERS_ROLE_PROBE } from '@/api/lib/appAdminUsersRole';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const guard = ensureAllowedOrigin(req);
  if (guard instanceof Response) return guard;

  if (req.method === 'OPTIONS') {
    return optionsResponse(req, 'POST, OPTIONS', 'Content-Type, Authorization, X-MFA-Code');
  }
  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  }

  const ctx = await requireAuth(req);
  if ('error' in ctx) return jsonResponse(req, { error: ctx.error }, ctx.status);
  const gate = await requireAdminMfa(req, ctx);
  if (!gate.ok) return jsonResponse(req, { error: gate.error }, gate.status);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: 'Invalid JSON body' }, 400);
  }

  const parsed = parseRoleChangeBody(body);
  if (!parsed.ok) return jsonResponse(req, { error: parsed.error }, 400);
  const { userId, role } = parsed;
  if (userId === ctx.user.id) {
    return jsonResponse(req, { error: APP_ADMIN_USERS_ROLE_PROBE.cannotChangeOwnRoleError }, 409);
  }

  const db = getDb();
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!u) return jsonResponse(req, { error: APP_ADMIN_USERS_ROLE_PROBE.notFoundError }, 404);

  await db.update(schema.users).set({ role }).where(eq(schema.users.id, userId));
  await db.insert(schema.auditLogs).values({
    walletAddress: u.walletAddress,
    action: APP_ADMIN_USERS_ROLE_PROBE.auditAction,
    details: `role=${role}`,
  });

  const bot = String(process.env.TELEGRAM_BOT_TOKEN ?? '').trim();
  if (bot) {
    try {
      const [settings] = await db.select().from(schema.userSettings).where(eq(schema.userSettings.userId, userId)).limit(1);
      if (!settings || settings.telegramNotificationsEnabled) {
        const [tg] = await db.select().from(schema.telegramLinks).where(eq(schema.telegramLinks.userId, userId)).limit(1);
        const chatId = tg?.chatId ? Number.parseInt(String(tg.chatId), 10) : Number.NaN;
        if (tg && Number.isFinite(chatId)) {
          const { telegramSendMessage } = await import('../../../telegram/lib');
          await telegramSendMessage(bot, chatId, `Rol actualizat: ${role}`);
        }
      }
    } catch {
      void 0;
    }
  }

  return jsonResponse(req, { ok: true });
}