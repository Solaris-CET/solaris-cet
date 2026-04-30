import { asc } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { getAllowedOrigin } from '../../lib/cors';
import { optionsResponse } from '../../lib/http';

export const config = { runtime: 'nodejs' };

function icsEscape(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function formatIcsDate(d: Date): string {
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

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') {
    return optionsResponse(req, 'GET, OPTIONS', 'Content-Type');
  }
  if (req.method !== 'GET') {
    return new Response('Method not allowed', {
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        Vary: 'Origin',
      },
    });
  }

  const db = getDb();
  const events = await db
    .select({
      slug: schema.events.slug,
      title: schema.events.title,
      description: schema.events.description,
      startAt: schema.events.startAt,
      endAt: schema.events.endAt,
      location: schema.events.location,
      joinUrl: schema.events.joinUrl,
      updatedAt: schema.events.updatedAt,
    })
    .from(schema.events)
    .orderBy(asc(schema.events.startAt))
    .limit(200);

  const prod = String(process.env.PUBLIC_SITE_URL ?? '').trim() || 'https://solaris-cet.com';
  const base = prod.replace(/\/$/, '');

  const lines: string[] = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//Solaris CET//Community Events//EN');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');

  for (const e of events) {
    const uid = `solaris-cet:${e.slug}`;
    const dtStart = formatIcsDate(e.startAt);
    const dtEnd = formatIcsDate(e.endAt ?? new Date(e.startAt.getTime() + 60 * 60 * 1000));
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

  const body = lines.join('\r\n');
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
      'Content-Disposition': 'inline; filename="solaris-cet-events.ics"',
    },
  });
}

