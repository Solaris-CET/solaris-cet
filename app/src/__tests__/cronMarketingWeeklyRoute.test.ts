// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildMarketingWeeklyTelegramMessage,
  CRON_MARKETING_WEEKLY_PATH,
  CRON_MARKETING_WEEKLY_PROBE,
  marketingWeeklySince,
} from '../../api/lib/cronMarketingWeekly';

const cronMocks = vi.hoisted(() => ({
  cronOk: true,
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
            where: async () => [{ c: 3 }],
          };
        },
      };
    },
  }),
  schema: {
    crmConversations: { createdAt: 'crmConversations.createdAt' },
    newsletterSubscriptions: { createdAt: 'newsletterSubscriptions.createdAt', status: 'newsletterSubscriptions.status' },
    shareEvents: { createdAt: 'shareEvents.createdAt' },
    referrals: { createdAt: 'referrals.createdAt' },
  },
}));

import cronMarketingWeeklyRoute, { CRON_MARKETING_WEEKLY_PROBE as routeProbe } from '../../api/cron/marketing-weekly/route';

function cronRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  headers.set('X-Cron-Secret', 'test-secret');
  return new Request(`http://test${CRON_MARKETING_WEEKLY_PATH}`, { ...init, headers });
}

describe('cronMarketingWeekly helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(CRON_MARKETING_WEEKLY_PROBE.path).toBe('/api/cron/marketing-weekly');
    expect(routeProbe.lookbackDays).toBe(7);
  });

  it('marketingWeeklySince is 7 days ago', () => {
    const now = Date.UTC(2026, 6, 7, 12, 0, 0);
    const since = marketingWeeklySince(now);
    expect(now - since.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('buildMarketingWeeklyTelegramMessage includes leads', () => {
    const msg = buildMarketingWeeklyTelegramMessage({
      ok: true,
      since: '2026-07-01T00:00:00.000Z',
      leads7d: 5,
      newsletter7d: { total: 2, active: 1, pending: 1, unsubscribed: 0 },
      shares7d: 3,
      referrals7d: 1,
    });
    expect(msg).toContain('Leads: 5');
  });
});

describe('/api/cron/marketing-weekly e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cronMocks.cronOk = true;
    process.env.CRON_SECRET = 'test-secret';
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(CRON_MARKETING_WEEKLY_PATH);
    expect(src).toContain('api/cron/marketing-weekly/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await cronMarketingWeeklyRoute(cronRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('POST returns weekly stats', async () => {
    const res = await cronMarketingWeeklyRoute(cronRequest({ method: 'POST' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; leads7d: number };
    expect(body.ok).toBe(true);
    expect(body.leads7d).toBe(3);
  });

  it('GET returns 405', async () => {
    const res = await cronMarketingWeeklyRoute(cronRequest({ method: 'GET' }));
    expect(res.status).toBe(405);
  });
});