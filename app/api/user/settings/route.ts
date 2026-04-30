import { eq } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { requireAuth } from '../../lib/auth';
import { jsonResponse, optionsResponse } from '../../lib/http';
import { ensureAllowedOrigin } from '../../lib/originGuard';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const guard = ensureAllowedOrigin(req);
  if (guard instanceof Response) return guard;

  if (req.method === 'OPTIONS') {
    return optionsResponse(req, 'POST, OPTIONS', 'Content-Type, Authorization');
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

  const displayNameRaw =
    typeof body === 'object' && body !== null && 'displayName' in body && typeof (body as { displayName?: unknown }).displayName === 'string'
      ? (body as { displayName: string }).displayName.trim().slice(0, 60)
      : null;
  const emailRaw =
    typeof body === 'object' && body !== null && 'email' in body && typeof (body as { email?: unknown }).email === 'string'
      ? (body as { email: string }).email.trim().slice(0, 254)
      : null;
  const emailRemindersEnabled =
    typeof body === 'object' && body !== null && 'emailRemindersEnabled' in body
      ? Boolean((body as { emailRemindersEnabled?: unknown }).emailRemindersEnabled)
      : null;
  const telegramNotificationsEnabled =
    typeof body === 'object' && body !== null && 'telegramNotificationsEnabled' in body
      ? Boolean((body as { telegramNotificationsEnabled?: unknown }).telegramNotificationsEnabled)
      : null;

  const localeRaw =
    typeof body === 'object' && body !== null && 'locale' in body && typeof (body as { locale?: unknown }).locale === 'string'
      ? (body as { locale: string }).locale.trim().toLowerCase().slice(0, 5)
      : null;
  const locale = localeRaw && ['en', 'ro', 'es'].includes(localeRaw) ? localeRaw : null;

  const themeRaw =
    typeof body === 'object' && body !== null && 'theme' in body && typeof (body as { theme?: unknown }).theme === 'string'
      ? (body as { theme: string }).theme.trim().toLowerCase().slice(0, 10)
      : null;
  const theme = themeRaw && ['dark', 'light', 'system'].includes(themeRaw) ? themeRaw : null;

  const db = getDb();
  const [existing] = await db.select().from(schema.userSettings).where(eq(schema.userSettings.userId, ctx.user.id));

  if (existing) {
    const changedEmail = (emailRaw ?? existing.email) !== existing.email;
    const changedTelegram = (telegramNotificationsEnabled ?? existing.telegramNotificationsEnabled) !== existing.telegramNotificationsEnabled;
    const changedLocale = (locale ?? existing.locale) !== existing.locale;
    const changedTheme = (theme ?? existing.theme) !== existing.theme;

    await db
      .update(schema.userSettings)
      .set({
        displayName: displayNameRaw ?? existing.displayName,
        email: emailRaw ?? existing.email,
        emailRemindersEnabled: emailRemindersEnabled ?? existing.emailRemindersEnabled,
        telegramNotificationsEnabled: telegramNotificationsEnabled ?? existing.telegramNotificationsEnabled,
        locale: locale ?? existing.locale,
        theme: theme ?? existing.theme,
        updatedAt: new Date(),
      })
      .where(eq(schema.userSettings.userId, ctx.user.id));

    if (changedEmail || changedTelegram || changedLocale || changedTheme) {
      const token = String(process.env.TELEGRAM_BOT_TOKEN ?? '').trim();
      if (token) {
        const [tg] = await db.select().from(schema.telegramLinks).where(eq(schema.telegramLinks.userId, ctx.user.id));
        const chatId = tg?.chatId ? Number.parseInt(String(tg.chatId), 10) : Number.NaN;
        if (tg && Number.isFinite(chatId) && (telegramNotificationsEnabled ?? existing.telegramNotificationsEnabled)) {
          const parts: string[] = [];
          if (changedEmail) parts.push('email');
          if (changedTelegram) parts.push('notificări');
          if (changedLocale) parts.push('limbă');
          if (changedTheme) parts.push('temă');
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
    await db.insert(schema.userSettings).values({
      userId: ctx.user.id,
      displayName: displayNameRaw,
      email: emailRaw,
      emailRemindersEnabled: emailRemindersEnabled ?? false,
      telegramNotificationsEnabled: telegramNotificationsEnabled ?? true,
      locale: locale ?? 'ro',
      theme: theme ?? 'dark',
    });
  }

  return jsonResponse(req, { ok: true });
}
