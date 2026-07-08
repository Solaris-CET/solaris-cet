// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildSurveyDashboardEngineUrl,
  SURVEY_DASHBOARD_PATH,
  SURVEY_DASHBOARD_PROBE,
  surveyDashboardHttpStatus,
} from '../../api/lib/surveyDashboard';

const fetchMock = vi.fn();

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import surveyDashboardRoute, { SURVEY_DASHBOARD_PROBE as routeProbe } from '../../api/survey/dashboard/route';

function dashboardRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${SURVEY_DASHBOARD_PATH}`, { method: 'GET', ...init, headers });
}

describe('surveyDashboard helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SURVEY_DASHBOARD_PROBE.path).toBe('/api/survey/dashboard');
    expect(routeProbe.authRequired).toBe(false);
  });

  it('buildSurveyDashboardEngineUrl points to dashboard endpoint', () => {
    expect(buildSurveyDashboardEngineUrl('http://engine.test/')).toBe('http://engine.test/dashboard');
  });

  it('surveyDashboardHttpStatus maps engine response', () => {
    expect(surveyDashboardHttpStatus(true)).toBe(200);
    expect(surveyDashboardHttpStatus(false)).toBe(502);
  });
});

describe('/api/survey/dashboard e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SURVEY_DASHBOARD_PATH);
    expect(src).toContain('api/survey/dashboard/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await surveyDashboardRoute(dashboardRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET returns dashboard data from engine', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reports: 12, avg_score: 88 }),
    });
    const res = await surveyDashboardRoute(dashboardRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { reports: number };
    expect(body.reports).toBe(12);
  });

  it('GET returns 503 when engine unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const res = await surveyDashboardRoute(dashboardRequest());
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_DASHBOARD_PROBE.unreachableError);
  });
});