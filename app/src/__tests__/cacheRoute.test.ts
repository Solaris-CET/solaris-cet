// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CACHE_PATH, CACHE_PROBE } from '../../api/lib/cache';

const statePayload = { price: 1.23, updatedAt: '2026-07-07T00:00:00.000Z' };

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import cacheRoute, { CACHE_PROBE as routeProbe } from '../../api/cache/route';

function cacheRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${CACHE_PATH}`, { ...init, headers });
}

describe('cache helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(CACHE_PROBE.path).toBe('/api/cache');
    expect(routeProbe.runtime).toBe('edge');
    expect(routeProbe.upstashKey).toBe('cet-state-json');
    expect(routeProbe.methods).toEqual(['GET', 'OPTIONS']);
  });
});

describe('/api/cache e2e probe', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/state.json')) {
        return new Response(JSON.stringify(statePayload), { status: 200 });
      }
      return new Response(JSON.stringify({ result: null }), { status: 200 });
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(CACHE_PATH);
    expect(src).toContain('api/cache/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await cacheRoute(cacheRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('GET returns state from fallback path', async () => {
    const res = await cacheRoute(cacheRequest({ method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { price: number };
    expect(body.price).toBe(1.23);
  });

  it('POST returns 405', async () => {
    const res = await cacheRoute(cacheRequest({ method: 'POST' }));
    expect(res.status).toBe(405);
  });

  it('GET returns unavailable when fallback fetch fails', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error('network');
    }) as typeof fetch;
    const res = await cacheRoute(cacheRequest({ method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(CACHE_PROBE.unavailableError);
  });
});