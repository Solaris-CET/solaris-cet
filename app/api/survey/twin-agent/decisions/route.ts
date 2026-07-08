import { getAllowedOrigin } from '@/api/lib/cors';
import {
  buildSurveyTwinAgentDecisionsEngineUrl,
  buildSurveyTwinAgentDecisionsSuccessPayload,
  parseSurveyTwinDecisionsReportId,
  parseSurveyTwinLimit,
  resolveSurveyTwinAgentDecisionsEngineUrl,
  SURVEY_TWIN_AGENT_DECISIONS_PROBE,
  surveyTwinAgentDecisionsErrorMessage,
} from '../../../lib/surveyTwinAgentDecisions';

export { SURVEY_TWIN_AGENT_DECISIONS_PATH, SURVEY_TWIN_AGENT_DECISIONS_PROBE } from '@/api/lib/surveyTwinAgentDecisions';

export const config = { runtime: 'nodejs' };

function json(body: unknown, origin: string, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
      'Cache-Control': SURVEY_TWIN_AGENT_DECISIONS_PROBE.cacheControl,
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
        'Access-Control-Allow-Methods': SURVEY_TWIN_AGENT_DECISIONS_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, allowed, 405);
  }

  const url = new URL(req.url);
  const reportId = parseSurveyTwinDecisionsReportId(url.searchParams.get(SURVEY_TWIN_AGENT_DECISIONS_PROBE.reportIdParam));
  const limit = parseSurveyTwinLimit(url.searchParams.get(SURVEY_TWIN_AGENT_DECISIONS_PROBE.limitParam));
  const engineUrl = resolveSurveyTwinAgentDecisionsEngineUrl();

  try {
    const res = await fetch(buildSurveyTwinAgentDecisionsEngineUrl(engineUrl, limit, reportId || undefined), {
      signal: AbortSignal.timeout(SURVEY_TWIN_AGENT_DECISIONS_PROBE.fetchTimeoutMs),
    });
    const data = await res.json();
    if (!res.ok) {
      return json(
        { error: surveyTwinAgentDecisionsErrorMessage(data) },
        allowed,
        SURVEY_TWIN_AGENT_DECISIONS_PROBE.engineErrorStatus,
      );
    }
    return json(buildSurveyTwinAgentDecisionsSuccessPayload(data as Record<string, unknown>), allowed, 200);
  } catch {
    return json({ error: SURVEY_TWIN_AGENT_DECISIONS_PROBE.unreachableError }, allowed, SURVEY_TWIN_AGENT_DECISIONS_PROBE.unreachableStatus);
  }
}