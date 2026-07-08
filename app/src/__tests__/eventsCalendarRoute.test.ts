// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildEventsIcsCalendar,
  EVENTS_CALENDAR_PATH,
  EVENTS_CALENDAR_PROBE,
  formatIcsDate,
  icsEscape,
} from '../../api/lib/eventsCalendar';

const calendarMocks = vi.hoisted(() => ({
  events: [
    {
      slug: 'solar-day',
      title: 'Solar Day',
      description: 'Workshop',
      startAt: new Date('2026-08-01T10:00:00Z'),
      endAt: new Date('2026-08-01T12:00:00Z'),
      location: 'Vaslui',
      joinUrl: null,
      updatedAt: new Date('2026-07-01T10:00:00Z'),
    },
  ],
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from() {
          return {
            orderBy() {
              return {
                limit: async () => calendarMocks.events,
              };
            },
          };
        },
      };
    },
  }),
  schema: {
    events: { startAt: 'events.startAt' },
  },
}));

import eventsCalendarRoute, { EVENTS_CALENDAR_PROBE as routeProbe } from '../../api/events/calendar/route';

function calendarRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${EVENTS_CALENDAR_PATH}`, { ...init, headers });
}

describe('eventsCalendar helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(EVENTS_CALENDAR_PROBE.path).toBe('/api/events/calendar');
    expect(routeProbe.contentType).toContain('text/calendar');
    expect(routeProbe.listLimit).toBe(200);
  });

  it('icsEscape escapes commas', () => {
    expect(icsEscape('a,b')).toBe('a\\,b');
  });

  it('buildEventsIcsCalendar includes VEVENT', () => {
    const ics = buildEventsIcsCalendar(calendarMocks.events, 'https://solaris-cet.com');
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('SUMMARY:Solar Day');
    expect(formatIcsDate(calendarMocks.events[0]!.startAt)).toMatch(/^\d{8}T\d{6}Z$/);
  });
});

describe('/api/events/calendar e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(EVENTS_CALENDAR_PATH);
    expect(src).toContain('api/events/calendar/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await eventsCalendarRoute(calendarRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET returns ICS calendar', async () => {
    const res = await eventsCalendarRoute(calendarRequest({ method: 'GET' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/calendar');
    const body = await res.text();
    expect(body).toContain('BEGIN:VEVENT');
    expect(body).toContain('Solar Day');
  });

  it('POST returns 405', async () => {
    const res = await eventsCalendarRoute(calendarRequest({ method: 'POST' }));
    expect(res.status).toBe(405);
  });
});