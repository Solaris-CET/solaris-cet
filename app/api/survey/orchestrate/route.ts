import { getAllowedOrigin } from '@/api/lib/cors';
import {
  buildSurveyOrchestrateSuccessPayload,
  parseSurveyOrchestrateReportId,
  probeSurveyOrchestrate,
  resolveSurveyOrchestrateEngineUrl,
  SURVEY_ORCHESTRATE_PROBE,
  surveyOrchestrateErrorMessage,
  surveyOrchestrateHttpStatus,
} from '../../lib/surveyOrchestrate';

export { SURVEY_ORCHESTRATE_PATH, SURVEY_ORCHESTRATE_PROBE } from '@/api/lib/surveyOrchestrate';

export const config = { runtime: 'nodejs' };

function json(body: unknown, origin: string, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
      'Cache-Control': SURVEY_ORCHESTRATE_PROBE.cacheControl,
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
        'Access-Control-Allow-Methods': SURVEY_ORCHESTRATE_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, allowed, 405);
  }

  const url = new URL(req.url);
  const reportId = parseSurveyOrchestrateReportId(url.searchParams.get(SURVEY_ORCHESTRATE_PROBE.reportIdParam));
  if (!reportId) {
    return json({ error: SURVEY_ORCHESTRATE_PROBE.missingReportIdError }, allowed, 400);
  }

  const engineUrl = resolveSurveyOrchestrateEngineUrl();
  const probe = await probeSurveyOrchestrate(engineUrl, reportId);
  if (!probe.ok) {
    return json({ error: SURVEY_ORCHESTRATE_PROBE.unreachableError }, allowed, SURVEY_ORCHESTRATE_PROBE.unreachableStatus);
  }
  if (probe.status !== 200) {
    return json(
      { error: surveyOrchestrateErrorMessage(probe.data) },
      allowed,
      surveyOrchestrateHttpStatus(probe.status),
    );
  }

  return json(buildSurveyOrchestrateSuccessPayload(probe.data), allowed, 200);
}