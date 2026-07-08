// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildEventReminderUrl,
  CRON_EVENT_REMINDERS_PATH,
  CRON_EVENT_REMINDERS_PROBE,
  eventReminderWindow,
} from '../../api/lib/cronEventReminders';

const cronMocks = vi.hoisted(() => ({
  cronOk: true,
  events: [] as Array<{ id: string; title: string; slug: string; startAt: Date }>,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/cron', () => ({
  cronAuthResult: () =>
    cronMocks.cronOk ? { ok: true as const } : { ok: false as const, status: 403, error: 'Forbidden' },
}));

vi.mock('../../api/telegram/lib', () => ({
  telegramSendMessage: async () => undefined,
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from() {
          return {
            where() {
              return {
                limit: async () => cronMocks.events,
              };
            },
          };
        },
      };
    },
  }),
  schema: {
    events: { startAt: 'events.startAt' },
    eventRsvps: { eventId: 'eventRsvps.eventId' },
    userSettings: { userId: 'userSettings.userId' },
    telegramLinks: { userId: 'telegramLinks.userId' },
  },
}));

import cronEventRemindersRoute, { CRON_EVENT_REMINDERS_PROBE as routeProbe } from '../../api/cron/event-reminders/route';

function cronRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  headers.set('X-Cron-Secret', 'test-secret');
  return new Request(`http://test${CRON_EVENT_REMINDERS_PATH}`, { ...init, headers });
}

describe('cronEventReminders helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(CRON_EVENT_REMINDERS_PROBE.path).toBe('/api/cron/event-reminders');
    expect(routeProbe.cronAuthRequired).toBe(true);
    expect(routeProbe.reminderWindowHoursMin).toBe(23);
  });

  it('eventReminderWindow spans 23-25 hours ahead', () => {
    const now = Date.UTC(2026, 6, 7, 12, 0, 0);
    const { from, to } = eventReminderWindow(now);
    expect(to.getTime() - from.getTime()).toBe(2 * 60 * 60 * 1000);
  });

  it('buildEventReminderUrl encodes slug', () => {
    expect(buildEventReminderUrl('https://solaris-cet.com', 'solar day')).toContain('solar%20day');
  });
});

describe('/api/cron/event-reminders e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cronMocks.cronOk = true;
    cronMocks.events = [];
    process.env.CRON_SECRET = 'test-secret';
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(CRON_EVENT_REMINDERS_PATH);
    expect(src).toContain('api/cron/event-reminders/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await cronEventRemindersRoute(cronRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('POST without cron auth returns 403', async () => {
    cronMocks.cronOk = false;
    const res = await cronEventRemindersRoute(cronRequest({ method: 'POST' }));
    expect(res.status).toBe(403);
  });

  it('POST processes reminders with no events', async () => {
    const res = await cronEventRemindersRoute(cronRequest({ method: 'POST' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; events: number };
    expect(body.ok).toBe(true);
    expect(body.events).toBe(0);
  });
});