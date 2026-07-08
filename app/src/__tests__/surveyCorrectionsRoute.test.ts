// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildSurveyCorrectionEngineBody,
  buildSurveyCorrectionsListUrl,
  parseSurveyCorrectionPayload,
  SURVEY_CORRECTIONS_PATH,
  SURVEY_CORRECTIONS_PROBE,
} from '../../api/lib/surveyCorrections';

const fetchMock = vi.fn();

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/surveyWebhook', () => ({
  dispatchSurveyWebhook: vi.fn(async () => undefined),
}));

vi.mock('../../api/lib/twinWebhook', () => ({
  dispatchTwinWebhook: vi.fn(async () => undefined),
}));

import surveyCorrectionsRoute, { SURVEY_CORRECTIONS_PROBE as routeProbe } from '../../api/survey/corrections/route';

function correctionsRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${SURVEY_CORRECTIONS_PATH}`, { ...init, headers });
}

describe('surveyCorrections helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SURVEY_CORRECTIONS_PROBE.path).toBe('/api/survey/corrections');
    expect(routeProbe.methods).toContain('POST');
  });

  it('parseSurveyCorrectionPayload validates required fields', () => {
    expect(
      parseSurveyCorrectionPayload({ report_id: 'rpt-1', field: 'roof_type', corrected: 'metal' })?.reportId,
    ).toBe('rpt-1');
    expect(parseSurveyCorrectionPayload({ report_id: 'rpt-1', field: 'roof_type' })).toBeNull();
  });

  it('buildSurveyCorrectionEngineBody maps payload', () => {
    const parsed = parseSurveyCorrectionPayload({
      report_id: 'rpt-1',
      field: 'roof_type',
      corrected: 'metal',
      technician: 'Ion',
    });
    expect(buildSurveyCorrectionEngineBody(parsed!)).toEqual({
      report_id: 'rpt-1',
      field: 'roof_type',
      original: '',
      corrected: 'metal',
      technician: 'Ion',
      notes: '',
    });
  });

  it('buildSurveyCorrectionsListUrl appends report filter', () => {
    expect(buildSurveyCorrectionsListUrl('http://engine.test', 'rpt-1')).toBe(
      'http://engine.test/corrections?report_id=rpt-1',
    );
  });
});

describe('/api/survey/corrections e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SURVEY_CORRECTIONS_PATH);
    expect(src).toContain('api/survey/corrections/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await surveyCorrectionsRoute(
      new Request(`http://test${SURVEY_CORRECTIONS_PATH}`, { method: 'OPTIONS', headers: { origin: 'https://allowed.test' } }),
    );
    expect(res.status).toBe(204);
  });

  it('GET lists corrections from engine', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ corrections: [] }),
    });
    const res = await surveyCorrectionsRoute(
      correctionsRequest({ method: 'GET' }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { platform: string; corrections: unknown[] };
    expect(body.platform).toBe('solaris-cet');
    expect(body.corrections).toEqual([]);
  });

  it('POST without required fields returns 400', async () => {
    const res = await surveyCorrectionsRoute(
      correctionsRequest({ method: 'POST', body: JSON.stringify({ report_id: 'rpt-1' }) }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_CORRECTIONS_PROBE.requiredFieldsError);
  });

  it('POST submits correction to engine', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, id: 'corr-1' }),
    });
    const res = await surveyCorrectionsRoute(
      correctionsRequest({
        method: 'POST',
        body: JSON.stringify({ report_id: 'rpt-1', field: 'roof_type', corrected: 'metal' }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { platform: string; ok: boolean };
    expect(body.platform).toBe('solaris-cet');
    expect(body.ok).toBe(true);
  });
});