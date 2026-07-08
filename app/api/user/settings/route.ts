import { eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireAuth } from '@/api/lib/auth';
import { jsonResponse, optionsResponse } from '@/api/lib/http';
import { ensureAllowedOrigin } from '@/api/lib/originGuard';
import {
  buildUserSettingsInsertValues,
  buildUserSettingsNotifyParts,
  buildUserSettingsUpdateValues,
  detectUserSettingsChanges,
  parseUserSettingsBody,
  USER_SETTINGS_PROBE,
} from '../../lib/userSettings';

export { USER_SETTINGS_PATH, USER_SETTINGS_PROBE } from '@/api/lib/userSettings';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const guard = ensureAllowedOrigin(req);
  if (guard instanceof Response) return guard;

  if (req.method === 'OPTIONS') {
    return optionsResponse(req, USER_SETTINGS_PROBE.methods.join(', '), USER_SETTINGS_PROBE.allowHeaders);
  }
  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  }

  const ctx = await requireAuth(req);
  if ('error' in ctx) return jsonResponse(req, { error: ctx.error }, ctx.status);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: 'Invalid JSON body' }, 400);
  }

  const patch = parseUserSettingsBody(body);
  const db = getDb();
  const [existing] = await db.select().from(schema.userSettings).where(eq(schema.userSettings.userId, ctx.user.id));

  if (existing) {
    const changes = detectUserSettingsChanges(existing, patch);
    await db
      .update(schema.userSettings)
      .set(buildUserSettingsUpdateValues(existing, patch))
      .where(eq(schema.userSettings.userId, ctx.user.id));

    if (changes.changedEmail || changes.changedTelegram || changes.changedLocale || changes.changedTheme) {
      const token = String(process.env.TELEGRAM_BOT_TOKEN ?? '').trim();
      if (token) {
        const [tg] = await db.select().from(schema.telegramLinks).where(eq(schema.telegramLinks.userId, ctx.user.id));
        const chatId = tg?.chatId ? Number.parseInt(String(tg.chatId), 10) : Number.NaN;
        if (tg && Number.isFinite(chatId) && (patch.telegramNotificationsEnabled ?? existing.telegramNotificationsEnabled)) {
          const parts = buildUserSettingsNotifyParts(changes);
          try {
            const { telegramSendMessage } = await import('../../telegram/lib');
            await telegramSendMessage(token, chatId, `Setări actualizate: ${parts.join(', ')}`);
          } catch {
            void 0;
          }
        }
      }
    }
  } else {
    await db.insert(schema.userSettings).values(buildUserSettingsInsertValues(ctx.user.id, patch));
  }

  return jsonResponse(req, { ok: true });
}