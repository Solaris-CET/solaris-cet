import { getAllowedOrigin } from '@/api/lib/cors';
import {
  buildSurveyContextSuccessPayload,
  parseSurveyContextReportId,
  probeSurveyContext,
  resolveSurveyContextEngineUrl,
  SURVEY_CONTEXT_PROBE,
  surveyContextErrorMessage,
  surveyContextHttpStatus,
} from '../../lib/surveyContext';

export { SURVEY_CONTEXT_PATH, SURVEY_CONTEXT_PROBE } from '@/api/lib/surveyContext';

export const config = { runtime: 'nodejs' };

function json(body: unknown, origin: string, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
      'Cache-Control': SURVEY_CONTEXT_PROBE.cacheControl,
    },
  });
}

export default async function handler(req: Request): Promise<Response> {
  const allowed = getAllowedOrigin(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowed,
        'Access-Control-Allow-Methods': SURVEY_CONTEXT_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, allowed, 405);
  }

  const url = new URL(req.url);
  const reportId = parseSurveyContextReportId(url.searchParams.get(SURVEY_CONTEXT_PROBE.reportIdParam));
  if (!reportId) {
    return json({ error: SURVEY_CONTEXT_PROBE.missingReportIdError }, allowed, 400);
  }

  const engineUrl = resolveSurveyContextEngineUrl();
  const probe = await probeSurveyContext(engineUrl, reportId);
  if (!probe.ok) {
    return json({ error: SURVEY_CONTEXT_PROBE.unreachableError }, allowed, SURVEY_CONTEXT_PROBE.unreachableStatus);
  }
  if (probe.status !== 200) {
    return json(
      { error: surveyContextErrorMessage(probe.data) },
      allowed,
      surveyContextHttpStatus(probe.status),
    );
  }

  return json(buildSurveyContextSuccessPayload(probe.data), allowed, 200);
}