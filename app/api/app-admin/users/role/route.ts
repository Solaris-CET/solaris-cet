import { eq } from 'drizzle-orm';

import { getDb, schema } from '../../../../db/client';
import { requireAdminMfa, requireAuth } from '../../../lib/auth';
import { jsonResponse, optionsResponse } from '../../../lib/http';
import { ensureAllowedOrigin } from '../../../lib/originGuard';

export const config = { runtime: 'nodejs' };

const ROLES = ['visitor', 'investor', 'admin'] as const;
type Role = (typeof ROLES)[number];

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

  const userId =
    typeof body === 'object' && body !== null && 'userId' in body && typeof (body as { userId?: unknown }).userId === 'string'
      ? (body as { userId: string }).userId.trim()
      : '';
  const roleRaw =
    typeof body === 'object' && body !== null && 'role' in body && typeof (body as { role?: unknown }).role === 'string'
      ? (body as { role: string }).role.trim().toLowerCase()
      : '';
  const role = (ROLES as readonly string[]).includes(roleRaw) ? (roleRaw as Role) : null;
  if (!userId || !role) return jsonResponse(req, { error: 'Invalid payload' }, 400);
  if (userId === ctx.user.id) return jsonResponse(req, { error: 'Cannot change own role' }, 409);

  const db = getDb();
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!u) return jsonResponse(req, { error: 'Not found' }, 404);

  await db.update(schema.users).set({ role }).where(eq(schema.users.id, userId));
  await db.insert(schema.auditLogs).values({ walletAddress: u.walletAddress, action: 'USER_ROLE_CHANGED', details: `role=${role}` });

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
