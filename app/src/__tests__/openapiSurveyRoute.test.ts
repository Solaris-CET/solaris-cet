// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getOpenApiSurveySpec,
  OPENAPI_SURVEY_AUTH_GUARD,
  OPENAPI_SURVEY_OPENAPI,
  OPENAPI_SURVEY_PATH,
  OPENAPI_SURVEY_PROBE,
  validateOpenApiSurveyQuery,
} from '../../api/lib/openapiSurvey';
import {
  buildSurveyOpenApiPaths,
  hasOpenApiOperation,
  SURVEY_OPENAPI_META_PATH,
  SURVEY_OPENAPI_TITLE,
} from '../../api/lib/surveyOpenApi';

const rateLimitMocks = vi.hoisted(() => ({ limited: false }));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => (rateLimitMocks.limited ? new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429 }) : null),
}));

import openapiSurveyRoute, { OPENAPI_SURVEY_PROBE as routeProbe } from '../../api/openapi/survey/route';

function surveyOpenApiRequest(init: RequestInit = {}): Request {
  return new Request(`http://test${OPENAPI_SURVEY_PATH}`, { ...init });
}

describe('openapiSurvey helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(OPENAPI_SURVEY_PROBE.path).toBe('/api/openapi/survey');
    expect(routeProbe.openapiVersion).toBe('3.1.0');
    expect(routeProbe.authRequired).toBe(false);
    expect(routeProbe.rateLimitKey).toBe('openapi-survey');
    expect(OPENAPI_SURVEY_AUTH_GUARD.public).toBe(true);
    expect(routeProbe.observabilityLabel).toBe('openapi.survey');
  });

  it('getOpenApiSurveySpec includes survey bridge paths', () => {
    const spec = getOpenApiSurveySpec();
    expect(spec.info.title).toBe(SURVEY_OPENAPI_TITLE);
    expect(spec.paths['/api/survey/health']).toBeTruthy();
  });

  it('documents the OpenAPI discovery route in the survey spec', () => {
    const paths = buildSurveyOpenApiPaths();
    expect(hasOpenApiOperation(paths, OPENAPI_SURVEY_OPENAPI.path, 'get')).toBe(true);
    expect(hasOpenApiOperation(paths, SURVEY_OPENAPI_META_PATH, 'get')).toBe(true);
    expect(OPENAPI_SURVEY_OPENAPI.summary).toContain('OpenAPI');
  });

  it('validateOpenApiSurveyQuery rejects unexpected query params', () => {
    expect(validateOpenApiSurveyQuery(new URLSearchParams())).toEqual({ ok: true });
    expect(validateOpenApiSurveyQuery(new URLSearchParams('debug=1'))).toEqual({
      ok: false,
      code: 'invalid_request',
      message: OPENAPI_SURVEY_PROBE.invalidQueryMessage,
    });
  });
});

describe('/api/openapi/survey e2e probe', () => {
  beforeEach(() => {
    rateLimitMocks.limited = false;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(OPENAPI_SURVEY_PATH);
    expect(src).toContain('api/openapi/survey/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await openapiSurveyRoute(surveyOpenApiRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET returns survey OpenAPI document', async () => {
    const res = await openapiSurveyRoute(surveyOpenApiRequest({ method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { openapi: string; info: { title: string }; paths: Record<string, unknown> };
    expect(body.openapi).toBe(OPENAPI_SURVEY_PROBE.openapiVersion);
    expect(body.info.title).toBe(SURVEY_OPENAPI_TITLE);
    expect(body.paths[OPENAPI_SURVEY_PATH]).toBeTruthy();
  });

  it('GET returns 400 for unexpected query parameters', async () => {
    const res = await openapiSurveyRoute(
      new Request(`http://test${OPENAPI_SURVEY_PATH}?debug=1`, { method: 'GET' }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('invalid_request');
    expect(body.error.message).toBe(OPENAPI_SURVEY_PROBE.invalidQueryMessage);
  });

  it('GET returns 429 when rate limited', async () => {
    rateLimitMocks.limited = true;
    const res = await openapiSurveyRoute(surveyOpenApiRequest({ method: 'GET' }));
    expect(res.status).toBe(429);
  });

  it('POST returns 405 with public API error shape', async () => {
    const res = await openapiSurveyRoute(surveyOpenApiRequest({ method: 'POST' }));
    expect(res.status).toBe(405);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe(OPENAPI_SURVEY_PROBE.methodNotAllowedCode);
    expect(body.error.message).toBe(OPENAPI_SURVEY_PROBE.methodNotAllowedMessage);
  });
});