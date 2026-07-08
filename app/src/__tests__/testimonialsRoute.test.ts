// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { buildTestimonialsPayload, STATIC_TESTIMONIALS, TESTIMONIALS_PATH, TESTIMONIALS_PROBE } from '../../api/lib/testimonials';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import testimonialsRoute, { TESTIMONIALS_PROBE as routeProbe } from '../../api/testimonials/route';

function testimonialsRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${TESTIMONIALS_PATH}`, { ...init, headers });
}

describe('testimonials helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(TESTIMONIALS_PROBE.path).toBe('/api/testimonials');
    expect(routeProbe.source).toBe('static');
    expect(STATIC_TESTIMONIALS.length).toBeGreaterThan(0);
  });

  it('buildTestimonialsPayload includes static items', () => {
    const payload = buildTestimonialsPayload(new Date('2026-07-07T12:00:00.000Z'));
    expect(payload.total).toBe(STATIC_TESTIMONIALS.length);
    expect(payload.updatedAt).toBe('2026-07-07T12:00:00.000Z');
  });
});

describe('/api/testimonials e2e probe', () => {
  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(TESTIMONIALS_PATH);
    expect(src).toContain('api/testimonials/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await testimonialsRoute(testimonialsRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET returns testimonials payload', async () => {
    const res = await testimonialsRoute(testimonialsRequest({ method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { testimonials: unknown[]; total: number; source: string };
    expect(body.total).toBe(STATIC_TESTIMONIALS.length);
    expect(body.source).toBe('static');
  });
});