import {
  getOpenApiSurveySpec,
  logOpenApiSurveyEvent,
  OPENAPI_SURVEY_AUTH_GUARD,
  OPENAPI_SURVEY_PROBE,
  validateOpenApiSurveyQuery,
} from '../../lib/openapiSurvey';
import {
  allowedOriginFromReq,
  errorResponsePublic,
  jsonResponsePublic,
  optionsResponsePublic,
} from '../../lib/publicApiResponse';
import { withRateLimit } from '@/api/lib/rateLimit';

export {
  OPENAPI_SURVEY_AUTH_GUARD,
  OPENAPI_SURVEY_OPENAPI,
  OPENAPI_SURVEY_PATH,
  OPENAPI_SURVEY_PROBE,
} from '../../lib/openapiSurvey';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponsePublic(req, OPENAPI_SURVEY_PROBE.methods.join(', '), 'Content-Type');
  }
  if (req.method !== 'GET') {
    logOpenApiSurveyEvent('error', { status: 405, reason: 'method' });
    return errorResponsePublic(
      req,
      405,
      OPENAPI_SURVEY_PROBE.methodNotAllowedCode,
      OPENAPI_SURVEY_PROBE.methodNotAllowedMessage,
    );
  }

  const allowedOrigin = allowedOriginFromReq(req);
  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: OPENAPI_SURVEY_PROBE.rateLimitKey,
    limit: OPENAPI_SURVEY_PROBE.rateLimit,
    windowSeconds: OPENAPI_SURVEY_PROBE.rateWindowSeconds,
  });
  if (limited) {
    logOpenApiSurveyEvent('error', { status: 429, reason: 'rate_limit' });
    return limited;
  }

  const query = validateOpenApiSurveyQuery(new URL(req.url).searchParams);
  if (!query.ok) {
    logOpenApiSurveyEvent('error', { status: 400, reason: 'validation' });
    return errorResponsePublic(req, 400, query.code, query.message);
  }

  if (OPENAPI_SURVEY_AUTH_GUARD.authRequired) {
    logOpenApiSurveyEvent('error', { status: 401, reason: 'auth' });
    return errorResponsePublic(req, 401, 'unauthorized', 'Unauthorized');
  }

  logOpenApiSurveyEvent('request', { path: OPENAPI_SURVEY_PROBE.path });
  const spec = getOpenApiSurveySpec();
  logOpenApiSurveyEvent('success', { paths: Object.keys(spec.paths).length });
  return jsonResponsePublic(req, spec, 200);
}