// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EVENTS_PATH, EVENTS_PROBE, eventsUpcomingCutoff } from '../../api/lib/events';

const eventsMocks = vi.hoisted(() => ({
  events: [
    {
      id: 'evt-1',
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
            where() {
              return {
                orderBy() {
                  return {
                    limit: async () => eventsMocks.events,
                  };
                },
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

import eventsRoute, { EVENTS_PROBE as routeProbe } from '../../api/events/route';

function eventsRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${EVENTS_PATH}`, { ...init, headers });
}

describe('events helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(EVENTS_PROBE.path).toBe('/api/events');
    expect(routeProbe.listLimit).toBe(100);
    expect(routeProbe.upcomingLookbackMs).toBe(24 * 60 * 60 * 1000);
  });

  it('eventsUpcomingCutoff is 24h before now', () => {
    const now = Date.UTC(2026, 6, 7, 12, 0, 0);
    const cutoff = eventsUpcomingCutoff(now);
    expect(now - cutoff.getTime()).toBe(EVENTS_PROBE.upcomingLookbackMs);
  });
});

describe('/api/events e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(EVENTS_PATH);
    expect(src).toContain('api/events/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await eventsRoute(eventsRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET returns upcoming events', async () => {
    const res = await eventsRoute(eventsRequest({ method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { events: Array<{ slug: string }> };
    expect(body.events).toHaveLength(1);
    expect(body.events[0]?.slug).toBe('solar-day');
  });

  it('POST returns 405', async () => {
    const res = await eventsRoute(eventsRequest({ method: 'POST' }));
    expect(res.status).toBe(405);
  });
});