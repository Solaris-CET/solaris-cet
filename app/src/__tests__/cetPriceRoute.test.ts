// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CET_PRICE_PATH, CET_PRICE_PROBE, parseCetPriceState } from '../../api/lib/cetPrice';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/cetPrice', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/lib/cetPrice')>();
  return {
    ...actual,
    loadCetPriceSnapshot: vi.fn(async () => ({
      symbol: 'CET' as const,
      priceTonPerCet: '0.0125',
      updatedAt: '2026-07-07T12:00:00.000Z',
    })),
  };
});

import cetPriceRoute, { CET_PRICE_PROBE as routeProbe } from '../../api/price/cet/route';

function cetPriceRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${CET_PRICE_PATH}`, { ...init, headers });
}

describe('cetPrice helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(CET_PRICE_PROBE.path).toBe('/api/price/cet');
    expect(routeProbe.symbol).toBe('CET');
    expect(routeProbe.authRequired).toBe(false);
  });

  it('parseCetPriceState extracts pool price', () => {
    expect(
      parseCetPriceState({
        pool: { priceTonPerCet: '0.0125' },
        updatedAt: '2026-07-07T12:00:00.000Z',
      }),
    ).toEqual({
      symbol: 'CET',
      priceTonPerCet: '0.0125',
      updatedAt: '2026-07-07T12:00:00.000Z',
    });
  });
});

describe('/api/price/cet e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(CET_PRICE_PATH);
    expect(src).toContain('api/price/cet/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await cetPriceRoute(cetPriceRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET returns CET price snapshot', async () => {
    const res = await cetPriceRoute(cetPriceRequest({ method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { symbol: string; priceTonPerCet: string };
    expect(body.symbol).toBe('CET');
    expect(body.priceTonPerCet).toBe('0.0125');
  });
});