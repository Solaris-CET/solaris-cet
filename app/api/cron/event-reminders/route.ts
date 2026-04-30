import { and, eq, gte, lt } from 'drizzle-orm';
import nodemailer from 'nodemailer';

import { getDb, schema } from '../../../db/client';
import { cronAuthResult } from '../../lib/cron';
import { jsonResponse, optionsResponse } from '../../lib/http';
import { telegramSendMessage } from '../../telegram/lib';

export const config = { runtime: 'nodejs' };

function env(name: string): string {
  return String(process.env[name] ?? '').trim();
}

function buildTransport() {
  const host = env('SMTP_HOST');
  const portRaw = env('SMTP_PORT');
  const user = env('SMTP_USER');
  const pass = env('SMTP_PASS');
  if (!host || !portRaw || !user || !pass) return null;
  const port = Number(portRaw);
  if (!Number.isFinite(port) || port <= 0) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req, 'POST, OPTIONS', 'Content-Type');
  }
  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  }

  const cron = cronAuthResult(req);
  if (!cron.ok) return jsonResponse(req, { error: cron.error }, cron.status);

  const db = getDb();
  const now = Date.now();
  const from = new Date(now + 23 * 60 * 60 * 1000);
  const to = new Date(now + 25 * 60 * 60 * 1000);

  const events = await db
    .select({
      id: schema.events.id,
      title: schema.events.title,
      slug: schema.events.slug,
      startAt: schema.events.startAt,
    })
    .from(schema.events)
    .where(and(gte(schema.events.startAt, from), lt(schema.events.startAt, to)))
    .limit(50);

  const botToken = env('TELEGRAM_BOT_TOKEN');
  const transport = buildTransport();
  const fromEmail = env('SMTP_FROM') || env('SMTP_USER');
  const site = env('PUBLIC_SITE_URL') || 'https://solaris-cet.com';
  const base = site.replace(/\/$/, '');

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

      const eventUrl = `${base}/evenimente/${encodeURIComponent(e.slug)}`;
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
