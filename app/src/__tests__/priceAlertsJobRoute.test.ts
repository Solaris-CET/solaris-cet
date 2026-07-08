// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PRICE_ALERTS_JOB_PATH, PRICE_ALERTS_JOB_PROBE } from '../../api/lib/priceAlertsJob';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/cron', () => ({
  requireCron: (req: Request) => req.headers.get('X-Cron-Secret') === 'test-secret',
}));

vi.mock('../../api/lib/cetPrice', () => ({
  fetchCetPriceUsd: async () => ({ priceUsd: 1.25, source: 'test' }),
}));

vi.mock('../../api/lib/tonPrice', () => ({
  fetchTonPriceUsd: async () => ({ priceUsd: 5.5, source: 'test' }),
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from() {
          return {
            where() {
              return {
                limit: async () => [],
              };
            },
          };
        },
      };
    },
  }),
  schema: {
    priceAlerts: { asset: 'priceAlerts.asset' },
  },
}));

import priceAlertsJobRoute, { PRICE_ALERTS_JOB_PROBE as routeProbe } from '../../api/jobs/price-alerts/route';

function alertsRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  headers.set('X-Cron-Secret', 'test-secret');
  return new Request(`http://test${PRICE_ALERTS_JOB_PATH}`, { ...init, headers });
}

describe('priceAlertsJob helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(PRICE_ALERTS_JOB_PROBE.path).toBe('/api/jobs/price-alerts');
    expect(routeProbe.assets).toEqual(['CET', 'TON']);
  });
});

describe('/api/jobs/price-alerts e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(PRICE_ALERTS_JOB_PATH);
    expect(src).toContain('api/jobs/price-alerts/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await priceAlertsJobRoute(alertsRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('POST runs price alert job', async () => {
    const res = await priceAlertsJobRoute(alertsRequest({ method: 'POST' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; triggered: number; prices: { CET: { priceUsd: number } } };
    expect(body.ok).toBe(true);
    expect(body.triggered).toBe(0);
    expect(body.prices.CET.priceUsd).toBe(1.25);
  });
});