// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  computeLyapunovScore,
  LYAPUNOV_PATH,
  LYAPUNOV_PROBE,
  parseLyapunovState,
} from '../../api/lib/lyapunov';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import lyapunovRoute, { LYAPUNOV_PROBE as routeProbe } from '../../api/lyapunov/route';

function lyapunovRequest(body: unknown, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  headers.set('Content-Type', 'application/json');
  return new Request(`http://test${LYAPUNOV_PATH}`, {
    method: 'POST',
    ...init,
    headers,
    body: JSON.stringify(body),
  });
}

describe('lyapunov helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(LYAPUNOV_PROBE.path).toBe('/api/lyapunov');
    expect(routeProbe.authRequired).toBe(false);
    expect(routeProbe.model).toBe('heuristic');
  });

  it('parseLyapunovState requires finite numeric fields', () => {
    expect(parseLyapunovState({ state: { balance: 10, price: 2, volatility: 5 } })).toEqual({
      balance: 10,
      price: 2,
      volatility: 5,
    });
    expect(parseLyapunovState({ state: { balance: NaN, price: 2, volatility: 5 } })).toBeNull();
  });

  it('computeLyapunovScore marks stability from score sign', () => {
    expect(computeLyapunovScore({ balance: 10, price: 2, volatility: 5 })).toEqual({ stable: true, score: 15 });
    expect(computeLyapunovScore({ balance: 1, price: 1, volatility: 5 })).toEqual({ stable: false, score: -4 });
  });
});

describe('/api/lyapunov e2e probe', () => {
  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(LYAPUNOV_PATH);
    expect(src).toContain('api/lyapunov/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await lyapunovRoute(
      new Request(`http://test${LYAPUNOV_PATH}`, { method: 'OPTIONS', headers: { origin: 'https://allowed.test' } }),
    );
    expect(res.status).toBe(204);
  });

  it('POST computes stability score', async () => {
    const res = await lyapunovRoute(lyapunovRequest({ state: { balance: 10, price: 2, volatility: 5 } }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { stable: boolean; score: number; model: string };
    expect(body.stable).toBe(true);
    expect(body.score).toBe(15);
    expect(body.model).toBe(LYAPUNOV_PROBE.model);
  });

  it('POST with invalid state returns 400', async () => {
    const res = await lyapunovRoute(lyapunovRequest({ state: { balance: 'x', price: 2, volatility: 5 } }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(LYAPUNOV_PROBE.invalidStateError);
  });

  it('GET returns 405', async () => {
    const res = await lyapunovRoute(
      new Request(`http://test${LYAPUNOV_PATH}`, { method: 'GET', headers: { origin: 'https://allowed.test' } }),
    );
    expect(res.status).toBe(405);
  });
});