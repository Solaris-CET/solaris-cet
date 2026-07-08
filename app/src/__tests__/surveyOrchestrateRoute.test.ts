// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildSurveyOrchestrateEngineUrl,
  parseSurveyOrchestrateReportId,
  SURVEY_ORCHESTRATE_PATH,
  SURVEY_ORCHESTRATE_PROBE,
} from '../../api/lib/surveyOrchestrate';

const fetchMock = vi.fn();

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import surveyOrchestrateRoute, { SURVEY_ORCHESTRATE_PROBE as routeProbe } from '../../api/survey/orchestrate/route';

function orchestrateRequest(reportId?: string, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  const query = reportId ? `?report_id=${encodeURIComponent(reportId)}` : '';
  return new Request(`http://test${SURVEY_ORCHESTRATE_PATH}${query}`, { method: 'GET', ...init, headers });
}

describe('surveyOrchestrate helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SURVEY_ORCHESTRATE_PROBE.path).toBe('/api/survey/orchestrate');
    expect(routeProbe.reportIdParam).toBe('report_id');
  });

  it('parseSurveyOrchestrateReportId validates report id', () => {
    expect(parseSurveyOrchestrateReportId(' rpt-1 ')).toBe('rpt-1');
    expect(parseSurveyOrchestrateReportId('')).toBeNull();
  });

  it('buildSurveyOrchestrateEngineUrl encodes report id', () => {
    expect(buildSurveyOrchestrateEngineUrl('http://engine.test', 'rpt 1')).toBe('http://engine.test/orchestrate/rpt%201');
  });
});

describe('/api/survey/orchestrate e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SURVEY_ORCHESTRATE_PATH);
    expect(src).toContain('api/survey/orchestrate/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await surveyOrchestrateRoute(orchestrateRequest('rpt-1', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET without report_id returns 400', async () => {
    const res = await surveyOrchestrateRoute(orchestrateRequest());
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_ORCHESTRATE_PROBE.missingReportIdError);
  });

  it('GET returns orchestration from engine', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ steps: ['validate', 'score'] }),
    });
    const res = await surveyOrchestrateRoute(orchestrateRequest('rpt-1'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { platform: string; orchestration: { steps: string[] } };
    expect(body.platform).toBe('solaris-cet');
    expect(body.orchestration.steps).toEqual(['validate', 'score']);
  });

  it('GET returns 503 when engine unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const res = await surveyOrchestrateRoute(orchestrateRequest('rpt-1'));
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_ORCHESTRATE_PROBE.unreachableError);
  });
});