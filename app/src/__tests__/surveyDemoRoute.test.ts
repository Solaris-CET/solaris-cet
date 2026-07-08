// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildSurveyDemoAhjFilename,
  buildSurveyDemoSuccessPayload,
  extractSurveyDemoPdfFilename,
  SURVEY_DEMO_PATH,
  SURVEY_DEMO_PROBE,
} from '../../api/lib/surveyDemo';

const fetchMock = vi.fn();

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import surveyDemoRoute, { SURVEY_DEMO_PROBE as routeProbe } from '../../api/survey/demo/route';

function demoRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${SURVEY_DEMO_PATH}`, { method: 'POST', ...init, headers });
}

describe('surveyDemo helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SURVEY_DEMO_PROBE.path).toBe('/api/survey/demo');
    expect(routeProbe.demoVerdict).toContain('Demo');
    expect(routeProbe.authRequired).toBe(false);
  });

  it('extractSurveyDemoPdfFilename uses basename', () => {
    expect(extractSurveyDemoPdfFilename('/data/RAPORT_demo.pdf', 'demo-1')).toBe('RAPORT_demo.pdf');
    expect(extractSurveyDemoPdfFilename('', 'demo-1')).toBe('RAPORT_demo-1.pdf');
  });

  it('buildSurveyDemoSuccessPayload adds file urls', () => {
    const payload = buildSurveyDemoSuccessPayload({
      reportId: 'demo-1',
      pdfFilename: 'RAPORT_demo-1.pdf',
      score: 90,
    });
    expect(payload.demo).toBe(true);
    expect(payload.ahj_filename).toBe(buildSurveyDemoAhjFilename('demo-1'));
    expect(payload.pdf_url).toContain('RAPORT_demo-1.pdf');
  });
});

describe('/api/survey/demo e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SURVEY_DEMO_PATH);
    expect(src).toContain('api/survey/demo/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await surveyDemoRoute(demoRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('POST returns demo payload from engine', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ report_id: 'demo-1', pdf_path: '/out/RAPORT_demo-1.pdf', score: 88 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ steps: ['validate', 'score'] }),
      });

    const res = await surveyDemoRoute(demoRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { report_id: string; demo: boolean; orchestration?: { steps: string[] } };
    expect(body.report_id).toBe('demo-1');
    expect(body.demo).toBe(true);
    expect(body.orchestration?.steps).toEqual(['validate', 'score']);
  });

  it('POST returns 503 when engine unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const res = await surveyDemoRoute(demoRequest());
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_DEMO_PROBE.unreachableError);
  });
});