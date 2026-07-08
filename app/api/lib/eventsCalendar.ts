export const EVENTS_CALENDAR_PATH = '/api/events/calendar';
export const EVENTS_CALENDAR_METHODS = 'GET, OPTIONS';

export const EVENTS_CALENDAR_PROBE = {
  path: EVENTS_CALENDAR_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  listLimit: 200,
  defaultDurationMs: 60 * 60 * 1000,
  defaultSiteUrl: 'https://solaris-cet.com' as const,
  contentType: 'text/calendar; charset=utf-8' as const,
  filename: 'solaris-cet-events.ics' as const,
  prodId: '-//Solaris CET//Community Events//EN' as const,
};

export type CalendarEventRow = {
  slug: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date | null;
  location: string | null;
  joinUrl: string | null;
  updatedAt: Date;
};

export function icsEscape(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

export function formatIcsDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    String(d.getUTCFullYear()) +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

export function buildEventsIcsCalendar(events: CalendarEventRow[], baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, '');
  const lines: string[] = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push(`PRODID:${EVENTS_CALENDAR_PROBE.prodId}`);
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');

  for (const e of events) {
    const uid = `solaris-cet:${e.slug}`;
    const dtStart = formatIcsDate(e.startAt);
    const dtEnd = formatIcsDate(e.endAt ?? new Date(e.startAt.getTime() + EVENTS_CALENDAR_PROBE.defaultDurationMs));
    const dtStamp = formatIcsDate(e.updatedAt);
    const url = `${base}/evenimente/${encodeURIComponent(e.slug)}`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${icsEscape(uid)}`);
    lines.push(`DTSTAMP:${dtStamp}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${icsEscape(e.title)}`);
    if (e.description) lines.push(`DESCRIPTION:${icsEscape(e.description)}`);
    if (e.location) lines.push(`LOCATION:${icsEscape(e.location)}`);
    if (e.joinUrl) lines.push(`URL:${icsEscape(e.joinUrl)}`);
    lines.push(`X-ALT-DESC;FMTTYPE=text/html:${icsEscape(`<a href="${url}">${e.title}</a>`)}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function resolveEventsCalendarSiteUrl(): string {
  return String(process.env.PUBLIC_SITE_URL ?? '').trim() || EVENTS_CALENDAR_PROBE.defaultSiteUrl;
}