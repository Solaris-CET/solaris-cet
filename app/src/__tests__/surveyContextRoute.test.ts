// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildSurveyContextEngineUrl,
  parseSurveyContextReportId,
  SURVEY_CONTEXT_PATH,
  SURVEY_CONTEXT_PROBE,
  surveyContextErrorMessage,
} from '../../api/lib/surveyContext';

const fetchMock = vi.fn();

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import surveyContextRoute, { SURVEY_CONTEXT_PROBE as routeProbe } from '../../api/survey/context/route';

function contextRequest(reportId?: string, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  const query = reportId ? `?report_id=${encodeURIComponent(reportId)}` : '';
  return new Request(`http://test${SURVEY_CONTEXT_PATH}${query}`, { method: 'GET', ...init, headers });
}

describe('surveyContext helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SURVEY_CONTEXT_PROBE.path).toBe('/api/survey/context');
    expect(routeProbe.reportIdParam).toBe('report_id');
  });

  it('parseSurveyContextReportId validates length', () => {
    expect(parseSurveyContextReportId(' rpt-1 ')).toBe('rpt-1');
    expect(parseSurveyContextReportId('')).toBeNull();
    expect(parseSurveyContextReportId('x'.repeat(81))).toBeNull();
  });

  it('buildSurveyContextEngineUrl encodes report id', () => {
    expect(buildSurveyContextEngineUrl('http://engine.test/', 'rpt 1')).toBe('http://engine.test/context/rpt%201');
  });

  it('surveyContextErrorMessage reads detail', () => {
    expect(surveyContextErrorMessage({ detail: 'missing' })).toBe('missing');
    expect(surveyContextErrorMessage({})).toBe(SURVEY_CONTEXT_PROBE.unavailableError);
  });
});

describe('/api/survey/context e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SURVEY_CONTEXT_PATH);
    expect(src).toContain('api/survey/context/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await surveyContextRoute(
      new Request(`http://test${SURVEY_CONTEXT_PATH}`, { method: 'OPTIONS', headers: { origin: 'https://allowed.test' } }),
    );
    expect(res.status).toBe(204);
  });

  it('GET without report_id returns 400', async () => {
    const res = await surveyContextRoute(contextRequest());
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_CONTEXT_PROBE.missingReportIdError);
  });

  it('GET returns context from engine', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ report_id: 'rpt-1', fields: [] }),
    });
    const res = await surveyContextRoute(contextRequest('rpt-1'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { platform: string; context: { report_id: string } };
    expect(body.platform).toBe('solaris-cet');
    expect(body.context.report_id).toBe('rpt-1');
  });

  it('GET returns 503 when engine unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const res = await surveyContextRoute(contextRequest('rpt-1'));
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_CONTEXT_PROBE.unreachableError);
  });
});