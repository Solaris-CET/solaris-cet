import { z } from 'zod';

import { logApiRouteEvent } from './apiObservability';
import {
  buildSurveyOpenApiSpec,
  SURVEY_API_VERSION,
  SURVEY_OPENAPI_META_PATH,
  SURVEY_OPENAPI_META_TAG,
  SURVEY_OPENAPI_VERSION,
} from './surveyOpenApi';

export const OPENAPI_SURVEY_PATH = '/api/openapi/survey';
export const OPENAPI_SURVEY_METHODS = 'GET, OPTIONS';

export const OPENAPI_SURVEY_PROBE = {
  path: OPENAPI_SURVEY_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  openapiVersion: SURVEY_OPENAPI_VERSION,
  apiVersion: SURVEY_API_VERSION,
  contentType: 'application/json' as const,
  rateLimitKey: 'openapi-survey' as const,
  rateLimit: 120,
  rateWindowSeconds: 60,
  methodNotAllowedCode: 'invalid_request' as const,
  methodNotAllowedMessage: 'Method not allowed' as const,
  invalidQueryCode: 'invalid_request' as const,
  invalidQueryMessage: 'Unexpected query parameters' as const,
  observabilityLabel: 'openapi.survey' as const,
};

export const OPENAPI_SURVEY_OPENAPI = {
  path: OPENAPI_SURVEY_PATH,
  method: 'get' as const,
  tag: SURVEY_OPENAPI_META_TAG,
  summary: 'Survey bridge OpenAPI 3.1 document',
};

export const OPENAPI_SURVEY_AUTH_GUARD = {
  public: true as const,
  authRequired: OPENAPI_SURVEY_PROBE.authRequired,
};

export const openApiSurveyQuerySchema = z.object({}).strict();

export function validateOpenApiSurveyQuery(
  searchParams: URLSearchParams,
): { ok: true } | { ok: false; code: typeof OPENAPI_SURVEY_PROBE.invalidQueryCode; message: string } {
  const query = Object.fromEntries(searchParams.entries());
  const parsed = openApiSurveyQuerySchema.safeParse(query);
  if (!parsed.success) {
    return {
      ok: false,
      code: OPENAPI_SURVEY_PROBE.invalidQueryCode,
      message: OPENAPI_SURVEY_PROBE.invalidQueryMessage,
    };
  }
  return { ok: true };
}

export function getOpenApiSurveySpec() {
  return buildSurveyOpenApiSpec();
}

export function logOpenApiSurveyEvent(
  event: 'request' | 'success' | 'error',
  meta: Record<string, unknown> = {},
): void {
  logApiRouteEvent(OPENAPI_SURVEY_PROBE.observabilityLabel, event, meta);
}

export function isOpenApiSurveyMetaPath(path: string): boolean {
  return path === SURVEY_OPENAPI_META_PATH;
}