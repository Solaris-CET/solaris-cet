// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { ADMIN_SURVEY_INSIGHTS_OPENAPI } from '../../api/lib/adminSurveyInsights';
import { ADMIN_SURVEYS_OPENAPI } from '../../api/lib/adminSurveys';
import {
  buildAdminSurveyOpenApiPaths,
  buildOpenApiSurveyMetaPaths,
  buildSurveyOpenApiPaths,
  buildSurveyOpenApiSpec,
  hasOpenApiOperation,
  isSurveyRouteId,
  listSurveyBridgePaths,
  openApiPathSummaries,
  SURVEY_ADMIN_OPENAPI_TAG,
  SURVEY_API_VERSION,
  SURVEY_OPENAPI_TAG,
  SURVEY_OPENAPI_TAG_DESCRIPTION,
  SURVEY_OPENAPI_TITLE,
  SURVEY_OPENAPI_VERSION,
  SURVEY_ROUTE_IDS,
  surveyBridgePath,
} from '../../api/lib/surveyOpenApi';

describe('surveyOpenApi', () => {
  it('includes all survey bridge routes', () => {
    const paths = buildSurveyOpenApiPaths();
    for (const id of SURVEY_ROUTE_IDS) {
      expect(paths[surveyBridgePath(id)], `missing route for ${id}`).toBeTruthy();
    }
  });

  it('buildSurveyOpenApiSpec has survey title and contract metadata', () => {
    const spec = buildSurveyOpenApiSpec();
    expect(spec.info.title).toBe(SURVEY_OPENAPI_TITLE);
    expect(spec.info.version).toBe(SURVEY_API_VERSION);
    expect(spec.openapi).toBe(SURVEY_OPENAPI_VERSION);
    expect(spec.servers[0]?.url).toBe('/');
    expect(spec.tags[0]).toEqual({ name: SURVEY_OPENAPI_TAG, description: SURVEY_OPENAPI_TAG_DESCRIPTION });
  });

  it('surveyBridgePath applies nested path overrides', () => {
    expect(surveyBridgePath('installer-me')).toBe('/api/survey/installer/me');
    expect(surveyBridgePath('twin-agent-execute')).toBe('/api/survey/twin-agent/execute');
    expect(surveyBridgePath('health')).toBe('/api/survey/health');
  });

  it('isSurveyRouteId narrows known route ids', () => {
    expect(isSurveyRouteId('generate')).toBe(true);
    expect(isSurveyRouteId('offline-manifest')).toBe(true);
    expect(isSurveyRouteId('unknown')).toBe(false);
  });

  it('listSurveyBridgePaths aligns with OpenAPI path keys', () => {
    const paths = buildSurveyOpenApiPaths();
    const bridgePaths = listSurveyBridgePaths();
    expect(bridgePaths).toHaveLength(SURVEY_ROUTE_IDS.length);
    for (const bridgePath of bridgePaths) {
      expect(paths[bridgePath], `OpenAPI missing ${bridgePath}`).toBeTruthy();
    }
  });

  it('hasOpenApiOperation detects generate POST and health GET', () => {
    const paths = buildSurveyOpenApiPaths();
    expect(hasOpenApiOperation(paths, '/api/survey/generate', 'post')).toBe(true);
    expect(hasOpenApiOperation(paths, '/api/survey/health', 'get')).toBe(true);
    expect(hasOpenApiOperation(paths, '/api/survey/health', 'post')).toBe(false);
  });

  it('multipart routes declare installer key header', () => {
    const paths = buildSurveyOpenApiPaths();
    const generate = paths['/api/survey/generate'] as {
      post?: {
        parameters?: { name: string }[];
        requestBody?: { content?: Record<string, unknown> };
      };
    };
    expect(generate.post?.requestBody?.content?.['multipart/form-data']).toBeTruthy();
    expect(generate.post?.parameters?.some((p) => p.name === 'X-Installer-Key')).toBe(true);
  });

  it('twin-stream documents SSE response', () => {
    const paths = buildSurveyOpenApiPaths();
    const twinStream = paths['/api/survey/twin-stream'] as {
      get?: { responses?: Record<string, { description?: string }> };
    };
    expect(twinStream.get?.responses?.['200']?.description).toBe('text/event-stream');
  });

  it('openApiPathSummaries returns human-readable operation labels', () => {
    const paths = buildSurveyOpenApiPaths();
    const summaries = openApiPathSummaries(paths);
    expect(summaries.length).toBeGreaterThanOrEqual(SURVEY_ROUTE_IDS.length);
    expect(summaries.some((s) => s.includes('health'))).toBe(true);
    expect(summaries.every((s) => s.trim().length > 0)).toBe(true);
  });

  it('corrections route supports GET and POST', () => {
    const paths = buildSurveyOpenApiPaths();
    expect(hasOpenApiOperation(paths, '/api/survey/corrections', 'get')).toBe(true);
    expect(hasOpenApiOperation(paths, '/api/survey/corrections', 'post')).toBe(true);
  });

  it('documents admin survey-insights and surveys routes', () => {
    const paths = buildSurveyOpenApiPaths();
    expect(hasOpenApiOperation(paths, ADMIN_SURVEY_INSIGHTS_OPENAPI.path, 'get')).toBe(true);
    expect(hasOpenApiOperation(paths, ADMIN_SURVEYS_OPENAPI.path, 'get')).toBe(true);
    const insights = paths[ADMIN_SURVEY_INSIGHTS_OPENAPI.path] as {
      get?: { parameters?: { name: string; required?: boolean }[]; tags?: string[] };
    };
    expect(insights.get?.tags).toContain(SURVEY_ADMIN_OPENAPI_TAG);
    expect(insights.get?.parameters?.some((p) => p.name === 'report_id' && p.required)).toBe(true);
  });

  it('documents OpenAPI discovery route', () => {
    const paths = buildOpenApiSurveyMetaPaths();
    expect(paths['/api/openapi/survey']).toBeTruthy();
    expect(hasOpenApiOperation(buildSurveyOpenApiPaths(), '/api/openapi/survey', 'get')).toBe(true);
  });

  it('buildAdminSurveyOpenApiPaths aligns with route OPENAPI exports', () => {
    const adminPaths = buildAdminSurveyOpenApiPaths();
    expect(Object.keys(adminPaths)).toEqual([
      ADMIN_SURVEY_INSIGHTS_OPENAPI.path,
      ADMIN_SURVEYS_OPENAPI.path,
    ]);
    const spec = buildSurveyOpenApiSpec();
    expect(spec.tags.some((t) => t.name === SURVEY_ADMIN_OPENAPI_TAG)).toBe(true);
  });
});