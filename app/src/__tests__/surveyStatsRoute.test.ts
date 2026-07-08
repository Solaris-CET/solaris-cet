// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildSurveyStatsEngineUrl,
  buildSurveyStatsSuccessPayload,
  SURVEY_STATS_PATH,
  SURVEY_STATS_PROBE,
} from '../../api/lib/surveyStats';

const fetchMock = vi.fn();

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import surveyStatsRoute, { SURVEY_STATS_PROBE as routeProbe } from '../../api/survey/stats/route';

function statsRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${SURVEY_STATS_PATH}`, { method: 'GET', ...init, headers });
}

describe('surveyStats helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SURVEY_STATS_PROBE.path).toBe('/api/survey/stats');
    expect(routeProbe.authRequired).toBe(false);
  });

  it('buildSurveyStatsEngineUrl points to stats endpoint', () => {
    expect(buildSurveyStatsEngineUrl('http://engine.test/')).toBe('http://engine.test/stats');
  });

  it('buildSurveyStatsSuccessPayload wraps stats', () => {
    expect(buildSurveyStatsSuccessPayload({ total: 5 })).toEqual({
      platform: 'solaris-cet',
      stats: { total: 5 },
    });
  });
});

describe('/api/survey/stats e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SURVEY_STATS_PATH);
    expect(src).toContain('api/survey/stats/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await surveyStatsRoute(statsRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET returns stats from engine', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ total_reports: 42, avg_score: 87 }),
    });
    const res = await surveyStatsRoute(statsRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { platform: string; stats: { total_reports: number } };
    expect(body.platform).toBe('solaris-cet');
    expect(body.stats.total_reports).toBe(42);
  });

  it('GET returns 502 when engine responds with error', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'degraded' }),
    });
    const res = await surveyStatsRoute(statsRequest());
    expect(res.status).toBe(502);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_STATS_PROBE.unavailableError);
  });

  it('GET returns 503 when engine unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const res = await surveyStatsRoute(statsRequest());
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_STATS_PROBE.unreachableError);
  });
});