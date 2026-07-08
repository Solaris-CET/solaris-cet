// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildSurveyFilesEngineUrl,
  safeSurveyFilePath,
  SURVEY_FILES_PATH,
  SURVEY_FILES_PROBE,
  surveyFileMediaType,
} from '../../api/lib/surveyFiles';

const fetchMock = vi.fn();

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import surveyFilesRoute, { SURVEY_FILES_PROBE as routeProbe } from '../../api/survey/files/route';

function filesRequest(file?: string, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  const query = file ? `?file=${encodeURIComponent(file)}` : '';
  return new Request(`http://test${SURVEY_FILES_PATH}${query}`, { method: 'GET', ...init, headers });
}

describe('surveyFiles helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SURVEY_FILES_PROBE.path).toBe('/api/survey/files');
    expect(routeProbe.fileParam).toBe('file');
  });

  it('safeSurveyFilePath rejects traversal', () => {
    expect(safeSurveyFilePath('report.pdf')).toBe('report.pdf');
    expect(safeSurveyFilePath('../secret.pdf')).toBeNull();
    expect(safeSurveyFilePath('/abs.pdf')).toBeNull();
  });

  it('buildSurveyFilesEngineUrl encodes segments', () => {
    expect(buildSurveyFilesEngineUrl('http://engine.test', 'folder/report.pdf')).toBe(
      'http://engine.test/files/folder/report.pdf',
    );
  });

  it('surveyFileMediaType detects pdf', () => {
    expect(surveyFileMediaType('report.PDF')).toBe('application/pdf');
    expect(surveyFileMediaType('meta.json')).toBe('application/json');
  });
});

describe('/api/survey/files e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SURVEY_FILES_PATH);
    expect(src).toContain('api/survey/files/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await surveyFilesRoute(
      new Request(`http://test${SURVEY_FILES_PATH}`, { method: 'OPTIONS', headers: { origin: 'https://allowed.test' } }),
    );
    expect(res.status).toBe(204);
  });

  it('GET without file param returns 400', async () => {
    const res = await surveyFilesRoute(filesRequest());
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_FILES_PROBE.invalidFileError);
  });

  it('GET proxies file from engine', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    });
    const res = await surveyFilesRoute(filesRequest('RAPORT_demo.pdf'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(fetchMock).toHaveBeenCalledWith(
      buildSurveyFilesEngineUrl('http://127.0.0.1:8000', 'RAPORT_demo.pdf'),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('GET returns 503 when engine unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const res = await surveyFilesRoute(filesRequest('report.pdf'));
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_FILES_PROBE.unreachableError);
  });
});