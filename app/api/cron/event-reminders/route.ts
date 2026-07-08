import { and, eq, gte, lt } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import {
  buildEventReminderSmtpTransport,
  buildEventReminderUrl,
  CRON_EVENT_REMINDERS_PROBE,
  envTrim,
  eventReminderWindow,
} from '../../lib/cronEventReminders';
import { cronAuthResult } from '@/api/lib/cron';
import { jsonResponse, optionsResponse } from '@/api/lib/http';
import { telegramSendMessage } from '../../telegram/lib';

export { CRON_EVENT_REMINDERS_PATH, CRON_EVENT_REMINDERS_PROBE } from '@/api/lib/cronEventReminders';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req, CRON_EVENT_REMINDERS_PROBE.methods.join(', '), 'Content-Type');
  }
  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  }

  const cron = cronAuthResult(req);
  if (!cron.ok) return jsonResponse(req, { error: cron.error }, cron.status);

  const db = getDb();
  const { from, to } = eventReminderWindow();

  const events = await db
    .select({
      id: schema.events.id,
      title: schema.events.title,
      slug: schema.events.slug,
      startAt: schema.events.startAt,
    })
    .from(schema.events)
    .where(and(gte(schema.events.startAt, from), lt(schema.events.startAt, to)))
    .limit(CRON_EVENT_REMINDERS_PROBE.eventsLimit);

  const botToken = envTrim('TELEGRAM_BOT_TOKEN');
  const transport = buildEventReminderSmtpTransport();
  const fromEmail = envTrim('SMTP_FROM') || envTrim('SMTP_USER');
  const base = envTrim('PUBLIC_SITE_URL') || CRON_EVENT_REMINDERS_PROBE.defaultSiteUrl;

  let emailSent = 0;
  let telegramSent = 0;

  for (const e of events) {
    const rsvps = await db
      .select({ userId: schema.eventRsvps.userId })
      .from(schema.eventRsvps)
      .where(eq(schema.eventRsvps.eventId, e.id));

    for (const r of rsvps) {
      const [settings] = await db.select().from(schema.userSettings).where(eq(schema.userSettings.userId, r.userId));
      const [tg] = await db.select().from(schema.telegramLinks).where(eq(schema.telegramLinks.userId, r.userId));

      const eventUrl = buildEventReminderUrl(base, e.slug);
      const startText = e.startAt.toISOString();
      const subject = `Reminder: ${e.title}`;

      if (transport && fromEmail && settings?.emailRemindersEnabled && settings.email) {
        try {
          await transport.sendMail({
            from: fromEmail,
            to: settings.email,
            subject,
            text: `${e.title}\n${startText}\n${eventUrl}`,
          });
          emailSent += 1;
        } catch {
          void 0;
        }
      }

      if (botToken && tg?.chatId && (settings?.telegramNotificationsEnabled ?? true)) {
        try {
          await telegramSendMessage(botToken, Number(tg.chatId), `Reminder: ${e.title}\n${startText}\n${eventUrl}`);
          telegramSent += 1;
        } catch {
          void 0;
        }
      }
    }
  }

  return jsonResponse(req, { ok: true, events: events.length, emailSent, telegramSent });
}