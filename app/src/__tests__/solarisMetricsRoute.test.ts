// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildSolarisPromMetricsBody,
  collectSolarisEnvSnapshot,
  escapePromLabelValue,
  resolveSolarisGitSha,
  SOLARIS_METRICS_PATH,
  SOLARIS_METRICS_PROBE,
} from '../../api/lib/solarisMetrics';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/aiMetrics', () => ({
  formatAiPromMetrics: () => '# TYPE solaris_ai_chat_requests_total counter\n',
}));

import solarisMetricsRoute, { SOLARIS_METRICS_PROBE as routeProbe } from '../../api/metrics/route';

function metricsRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${SOLARIS_METRICS_PATH}`, { ...init, headers });
}

describe('solarisMetrics helpers', () => {
  beforeEach(() => {
    process.env.GIT_SHA = 'abc123';
    process.env.DATABASE_URL = 'postgres://local/test';
    process.env.GROK_API_KEY = 'grok';
    process.env.GEMINI_API_KEY = 'gemini';
  });

  afterEach(() => {
    delete process.env.GIT_SHA;
    delete process.env.DATABASE_URL;
    delete process.env.GROK_API_KEY;
    delete process.env.GEMINI_API_KEY;
  });

  it('exports stable e2e probe contract', () => {
    expect(SOLARIS_METRICS_PROBE.path).toBe('/api/metrics');
    expect(routeProbe.authRequired).toBe(false);
    expect(routeProbe.contentType).toContain('text/plain');
  });

  it('resolveSolarisGitSha prefers GIT_SHA', () => {
    expect(resolveSolarisGitSha()).toBe('abc123');
  });

  it('escapePromLabelValue escapes quotes', () => {
    expect(escapePromLabelValue('sha"test')).toBe('sha\\"test');
  });

  it('buildSolarisPromMetricsBody includes core gauges', () => {
    const body = buildSolarisPromMetricsBody(collectSolarisEnvSnapshot(), 1_700_000_000);
    expect(body).toContain('solaris_up 1');
    expect(body).toContain('solaris_time_seconds 1700000000');
    expect(body).toContain('solaris_ai_configured 1');
    expect(body).toContain('solaris_db_configured 1');
    expect(body).toContain('git_sha="abc123"');
  });
});

describe('/api/metrics e2e probe', () => {
  beforeEach(() => {
    process.env.DATABASE_URL = 'postgres://local/test';
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SOLARIS_METRICS_PATH);
    expect(src).toContain('api/metrics/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await solarisMetricsRoute(metricsRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET returns prometheus text', async () => {
    const res = await solarisMetricsRoute(metricsRequest({ method: 'GET' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe(SOLARIS_METRICS_PROBE.contentType);
    const text = await res.text();
    expect(text).toContain('solaris_up 1');
    expect(text).toContain('solaris_db_configured 1');
  });

  it('POST returns 405', async () => {
    const res = await solarisMetricsRoute(metricsRequest({ method: 'POST' }));
    expect(res.status).toBe(405);
  });
});