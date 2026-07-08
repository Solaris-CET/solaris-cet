// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildSurveyPermitPackEngineUrl,
  buildSurveyPermitPackFilename,
  parseSurveyPermitPackReportId,
  SURVEY_PERMIT_PACK_PATH,
  SURVEY_PERMIT_PACK_PROBE,
} from '../../api/lib/surveyPermitPack';

const fetchMock = vi.fn();

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import surveyPermitPackRoute, { SURVEY_PERMIT_PACK_PROBE as routeProbe } from '../../api/survey/permit-pack/route';

function permitPackRequest(reportId?: string, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  const query = reportId ? `?report_id=${encodeURIComponent(reportId)}` : '';
  return new Request(`http://test${SURVEY_PERMIT_PACK_PATH}${query}`, { method: 'GET', ...init, headers });
}

describe('surveyPermitPack helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SURVEY_PERMIT_PACK_PROBE.path).toBe('/api/survey/permit-pack');
    expect(routeProbe.zipMediaType).toBe('application/zip');
  });

  it('parseSurveyPermitPackReportId validates report id', () => {
    expect(parseSurveyPermitPackReportId('rpt-1')).toBe('rpt-1');
    expect(parseSurveyPermitPackReportId(null)).toBeNull();
  });

  it('buildSurveyPermitPackFilename and engine url', () => {
    expect(buildSurveyPermitPackFilename('rpt-1')).toBe('PERMIT_rpt-1.zip');
    expect(buildSurveyPermitPackEngineUrl('http://engine.test', 'rpt-1')).toBe('http://engine.test/permit-pack/rpt-1');
  });
});

describe('/api/survey/permit-pack e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SURVEY_PERMIT_PACK_PATH);
    expect(src).toContain('api/survey/permit-pack/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await surveyPermitPackRoute(permitPackRequest('rpt-1', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET without report_id returns 400', async () => {
    const res = await surveyPermitPackRoute(permitPackRequest());
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_PERMIT_PACK_PROBE.missingReportIdError);
  });

  it('GET proxies zip from engine', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new Uint8Array([80, 75, 3, 4]).buffer,
    });
    const res = await surveyPermitPackRoute(permitPackRequest('rpt-1'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/zip');
    expect(res.headers.get('Content-Disposition')).toContain('PERMIT_rpt-1.zip');
  });

  it('GET returns 503 when engine unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const res = await surveyPermitPackRoute(permitPackRequest('rpt-1'));
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_PERMIT_PACK_PROBE.unreachableError);
  });
});