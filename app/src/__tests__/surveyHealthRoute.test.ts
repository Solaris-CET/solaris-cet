// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildSurveyEngineHealthUrl,
  buildSurveyHealthSuccessPayload,
  buildSurveyHealthUnreachablePayload,
  resolveSurveyEngineUrl,
  SURVEY_HEALTH_PATH,
  SURVEY_HEALTH_PROBE,
  surveyHealthHttpStatus,
} from '../../api/lib/surveyHealth';

const fetchMock = vi.fn();

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import surveyHealthRoute, { SURVEY_HEALTH_PROBE as routeProbe } from '../../api/survey/health/route';

function healthRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${SURVEY_HEALTH_PATH}`, { ...init, headers });
}

describe('surveyHealth helpers', () => {
  afterEach(() => {
    delete process.env.SURVEY_ENGINE_URL;
  });

  it('exports stable e2e probe contract', () => {
    expect(SURVEY_HEALTH_PROBE.path).toBe('/api/survey/health');
    expect(routeProbe.platform).toBe('solaris-cet');
    expect(routeProbe.authRequired).toBe(false);
  });

  it('resolveSurveyEngineUrl uses env or default', () => {
    expect(resolveSurveyEngineUrl({} as NodeJS.ProcessEnv)).toBe(SURVEY_HEALTH_PROBE.defaultEngineUrl);
    expect(resolveSurveyEngineUrl({ SURVEY_ENGINE_URL: ' http://engine.test/ ' })).toBe('http://engine.test/');
  });

  it('buildSurveyEngineHealthUrl trims trailing slash', () => {
    expect(buildSurveyEngineHealthUrl('http://engine.test/')).toBe('http://engine.test/health');
    expect(buildSurveyEngineHealthUrl('http://engine.test')).toBe('http://engine.test/health');
  });

  it('buildSurveyHealth payloads shape response', () => {
    expect(buildSurveyHealthSuccessPayload({ ok: true }, 'http://engine.test')).toEqual({
      platform: 'solaris-cet',
      engine: { ok: true },
      engine_url: 'http://engine.test',
    });
    expect(buildSurveyHealthUnreachablePayload('http://engine.test').engine).toEqual({
      ok: false,
      error: SURVEY_HEALTH_PROBE.unreachableError,
    });
  });

  it('surveyHealthHttpStatus maps engine response', () => {
    expect(surveyHealthHttpStatus(true)).toBe(200);
    expect(surveyHealthHttpStatus(false)).toBe(502);
  });
});

describe('/api/survey/health e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SURVEY_ENGINE_URL;
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SURVEY_HEALTH_PATH);
    expect(src).toContain('api/survey/health/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await surveyHealthRoute(healthRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET returns engine health when reachable', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, version: '1.0.0' }),
    });
    const res = await surveyHealthRoute(healthRequest({ method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { platform: string; engine: { ok: boolean }; engine_url: string };
    expect(body.platform).toBe('solaris-cet');
    expect(body.engine.ok).toBe(true);
    expect(body.engine_url).toBe(SURVEY_HEALTH_PROBE.defaultEngineUrl);
    expect(fetchMock).toHaveBeenCalledWith(
      buildSurveyEngineHealthUrl(SURVEY_HEALTH_PROBE.defaultEngineUrl),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('GET returns 502 when engine responds with error status', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ ok: false, error: 'degraded' }),
    });
    const res = await surveyHealthRoute(healthRequest({ method: 'GET' }));
    expect(res.status).toBe(502);
    const body = (await res.json()) as { engine: { error: string } };
    expect(body.engine.error).toBe('degraded');
  });

  it('GET returns 503 when engine is unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const res = await surveyHealthRoute(healthRequest({ method: 'GET' }));
    expect(res.status).toBe(503);
    const body = (await res.json()) as { engine: { ok: boolean; error: string } };
    expect(body.engine.ok).toBe(false);
    expect(body.engine.error).toBe(SURVEY_HEALTH_PROBE.unreachableError);
  });
});