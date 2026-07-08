import nodemailer from 'nodemailer';

export const CRON_EVENT_REMINDERS_PATH = '/api/cron/event-reminders';
export const CRON_EVENT_REMINDERS_METHODS = 'POST, OPTIONS';

export const CRON_EVENT_REMINDERS_PROBE = {
  path: CRON_EVENT_REMINDERS_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  cronAuthRequired: true,
  reminderWindowHoursMin: 23,
  reminderWindowHoursMax: 25,
  eventsLimit: 50,
  defaultSiteUrl: 'https://solaris-cet.com' as const,
};

export function envTrim(name: string): string {
  return String(process.env[name] ?? '').trim();
}

export function buildEventReminderSmtpTransport() {
  const host = envTrim('SMTP_HOST');
  const portRaw = envTrim('SMTP_PORT');
  const user = envTrim('SMTP_USER');
  const pass = envTrim('SMTP_PASS');
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

export function eventReminderWindow(now = Date.now()): { from: Date; to: Date } {
  return {
    from: new Date(now + CRON_EVENT_REMINDERS_PROBE.reminderWindowHoursMin * 60 * 60 * 1000),
    to: new Date(now + CRON_EVENT_REMINDERS_PROBE.reminderWindowHoursMax * 60 * 60 * 1000),
  };
}

export function buildEventReminderUrl(base: string, slug: string): string {
  return `${base.replace(/\/$/, '')}/evenimente/${encodeURIComponent(slug)}`;
}