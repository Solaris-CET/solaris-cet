// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildSurveyTwinAgentEngineUrl,
  parseSurveyTwinAgentReportId,
  SURVEY_TWIN_AGENT_PATH,
  SURVEY_TWIN_AGENT_PROBE,
} from '../../api/lib/surveyTwinAgent';

const fetchMock = vi.fn();

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import surveyTwinAgentRoute, { SURVEY_TWIN_AGENT_PROBE as routeProbe } from '../../api/survey/twin-agent/route';

function twinAgentRequest(reportId?: string, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  const query = reportId ? `?report_id=${encodeURIComponent(reportId)}` : '';
  return new Request(`http://test${SURVEY_TWIN_AGENT_PATH}${query}`, { method: 'GET', ...init, headers });
}

describe('surveyTwinAgent helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SURVEY_TWIN_AGENT_PROBE.path).toBe('/api/survey/twin-agent');
    expect(routeProbe.authRequired).toBe(false);
  });

  it('parseSurveyTwinAgentReportId validates report id', () => {
    expect(parseSurveyTwinAgentReportId(' rpt-1 ')).toBe('rpt-1');
    expect(parseSurveyTwinAgentReportId('')).toBeNull();
  });

  it('buildSurveyTwinAgentEngineUrl encodes report id', () => {
    expect(buildSurveyTwinAgentEngineUrl('http://engine.test', 'rpt 1')).toBe('http://engine.test/twin-agent/rpt%201');
  });
});

describe('/api/survey/twin-agent e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SURVEY_TWIN_AGENT_PATH);
    expect(src).toContain('api/survey/twin-agent/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await surveyTwinAgentRoute(twinAgentRequest('rpt-1', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET without report_id returns 400', async () => {
    const res = await surveyTwinAgentRoute(twinAgentRequest());
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_TWIN_AGENT_PROBE.missingReportIdError);
  });

  it('GET returns twin agent plan from engine', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ actions: [{ id: 'a1', type: 'review' }] }),
    });
    const res = await surveyTwinAgentRoute(twinAgentRequest('rpt-1'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { platform: string; plan: { actions: unknown[] } };
    expect(body.platform).toBe('solaris-cet');
    expect(body.plan.actions).toHaveLength(1);
  });

  it('GET returns 503 when engine unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const res = await surveyTwinAgentRoute(twinAgentRequest('rpt-1'));
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_TWIN_AGENT_PROBE.unreachableError);
  });
});