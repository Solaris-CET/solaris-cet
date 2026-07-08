// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  computeOverallHealth,
  HEALTH_PATH,
  HEALTH_PROBE,
  healthHttpStatus,
  resolveHealthVersion,
} from '../../api/lib/healthCheck';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    execute: async () => [{ '?column?': 1 }],
  }),
}));

import healthRoute, { HEALTH_PROBE as routeProbe } from '../../api/health/route';

function healthRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${HEALTH_PATH}`, { ...init, headers });
}

describe('healthCheck helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(HEALTH_PROBE.path).toBe('/api/health');
    expect(routeProbe.authRequired).toBe(false);
  });

  it('computeOverallHealth and healthHttpStatus', () => {
    expect(computeOverallHealth('ok', 'skipped')).toBe('ok');
    expect(computeOverallHealth('ok', 'error')).toBe('degraded');
    expect(healthHttpStatus('down')).toBe(503);
    expect(resolveHealthVersion()).toBeTruthy();
  });
});

describe('/api/health e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.BUILD_SHA;
    delete process.env.GIT_SHA;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(HEALTH_PATH);
    expect(src).toContain('api/health/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await healthRoute(healthRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET returns health status', async () => {
    const res = await healthRoute(healthRequest({ method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; checks: { database: { status: string } } };
    expect(body.status).toBe('ok');
    expect(body.checks.database.status).toBe('ok');
  });
});