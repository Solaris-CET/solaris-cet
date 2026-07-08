// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildSurveyJurisdictionsEngineUrl,
  SURVEY_JURISDICTIONS_PATH,
  SURVEY_JURISDICTIONS_PROBE,
  surveyJurisdictionsHttpStatus,
} from '../../api/lib/surveyJurisdictions';

const fetchMock = vi.fn();

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import surveyJurisdictionsRoute, { SURVEY_JURISDICTIONS_PROBE as routeProbe } from '../../api/survey/jurisdictions/route';

function jurisdictionsRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${SURVEY_JURISDICTIONS_PATH}`, { method: 'GET', ...init, headers });
}

describe('surveyJurisdictions helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SURVEY_JURISDICTIONS_PROBE.path).toBe('/api/survey/jurisdictions');
    expect(routeProbe.authRequired).toBe(false);
  });

  it('buildSurveyJurisdictionsEngineUrl points to jurisdictions endpoint', () => {
    expect(buildSurveyJurisdictionsEngineUrl('http://engine.test/')).toBe('http://engine.test/jurisdictions');
  });

  it('surveyJurisdictionsHttpStatus maps engine response', () => {
    expect(surveyJurisdictionsHttpStatus(true)).toBe(200);
    expect(surveyJurisdictionsHttpStatus(false)).toBe(502);
  });
});

describe('/api/survey/jurisdictions e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SURVEY_JURISDICTIONS_PATH);
    expect(src).toContain('api/survey/jurisdictions/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await surveyJurisdictionsRoute(jurisdictionsRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET returns jurisdictions from engine', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jurisdictions: ['RO-VS', 'RO-BC'] }),
    });
    const res = await surveyJurisdictionsRoute(jurisdictionsRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { jurisdictions: string[] };
    expect(body.jurisdictions).toHaveLength(2);
  });

  it('GET returns 503 when engine unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const res = await surveyJurisdictionsRoute(jurisdictionsRequest());
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_JURISDICTIONS_PROBE.unreachableError);
  });
});