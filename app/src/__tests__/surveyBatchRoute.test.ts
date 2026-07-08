// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildSurveyBatchFileUrl,
  buildSurveyBatchSuccessPayload,
  isSurveyBatchMultipartContentType,
  mapSurveyBatchResults,
  SURVEY_BATCH_PATH,
  SURVEY_BATCH_PROBE,
} from '../../api/lib/surveyBatch';

const fetchMock = vi.fn();

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import surveyBatchRoute, { SURVEY_BATCH_PROBE as routeProbe } from '../../api/survey/batch/route';

function batchRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${SURVEY_BATCH_PATH}`, { method: 'POST', ...init, headers });
}

const engineResult = {
  total: 1,
  succeeded: 1,
  failed: 0,
  results: [
    {
      job_id: 'job-1',
      success: true,
      report_id: 'rpt-1',
      pdf_filename: 'report.pdf',
      ahj_filename: 'ahj.json',
      score: 95,
      error: '',
    },
  ],
};

describe('surveyBatch helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SURVEY_BATCH_PROBE.path).toBe('/api/survey/batch');
    expect(routeProbe.expectedContentType).toBe('multipart/form-data');
  });

  it('isSurveyBatchMultipartContentType detects multipart', () => {
    expect(isSurveyBatchMultipartContentType('multipart/form-data; boundary=abc')).toBe(true);
    expect(isSurveyBatchMultipartContentType('application/json')).toBe(false);
  });

  it('mapSurveyBatchResults adds file urls', () => {
    const mapped = mapSurveyBatchResults(engineResult.results);
    expect(mapped[0]?.pdf_url).toBe(buildSurveyBatchFileUrl('report.pdf'));
    expect(mapped[0]?.ahj_url).toBe(buildSurveyBatchFileUrl('ahj.json'));
  });

  it('buildSurveyBatchSuccessPayload preserves counters', () => {
    const payload = buildSurveyBatchSuccessPayload(engineResult);
    expect(payload.total).toBe(1);
    expect(payload.results[0]?.pdf_url).toContain('/api/survey/files');
  });
});

describe('/api/survey/batch e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SURVEY_BATCH_PATH);
    expect(src).toContain('api/survey/batch/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await surveyBatchRoute(
      new Request(`http://test${SURVEY_BATCH_PATH}`, { method: 'OPTIONS', headers: { origin: 'https://allowed.test' } }),
    );
    expect(res.status).toBe(204);
  });

  it('POST without multipart returns 415', async () => {
    const res = await surveyBatchRoute(batchRequest({ headers: { 'Content-Type': 'application/json' }, body: '{}' }));
    expect(res.status).toBe(415);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_BATCH_PROBE.invalidContentTypeError);
  });

  it('POST forwards multipart to engine and maps results', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => engineResult,
    });

    const form = new FormData();
    form.append('file', new Blob(['pdf']), 'sample.pdf');
    const res = await surveyBatchRoute(batchRequest({ body: form }));

    expect(res.status).toBe(200);
    const body = (await res.json()) as { total: number; results: Array<{ pdf_url: string }> };
    expect(body.total).toBe(1);
    expect(body.results[0]?.pdf_url).toContain('report.pdf');
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('POST returns 503 when engine unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const form = new FormData();
    form.append('file', new Blob(['pdf']), 'sample.pdf');
    const res = await surveyBatchRoute(batchRequest({ body: form }));
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_BATCH_PROBE.unreachableError);
  });
});