import { getAllowedOrigin } from '@/api/lib/cors';
import {
  buildSurveyTwinEventsEngineUrl,
  buildSurveyTwinEventsSuccessPayload,
  parseSurveyTwinEventsReportId,
  parseSurveyTwinLimit,
  resolveSurveyTwinEventsEngineUrl,
  SURVEY_TWIN_EVENTS_PROBE,
  surveyTwinEventsErrorMessage,
} from '../../lib/surveyTwinEvents';

export { SURVEY_TWIN_EVENTS_PATH, SURVEY_TWIN_EVENTS_PROBE } from '@/api/lib/surveyTwinEvents';

export const config = { runtime: 'nodejs' };

function json(body: unknown, origin: string, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
      'Cache-Control': SURVEY_TWIN_EVENTS_PROBE.cacheControl,
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
        'Access-Control-Allow-Methods': SURVEY_TWIN_EVENTS_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, allowed, 405);
  }

  const url = new URL(req.url);
  const reportId = parseSurveyTwinEventsReportId(url.searchParams.get(SURVEY_TWIN_EVENTS_PROBE.reportIdParam));
  const limit = parseSurveyTwinLimit(url.searchParams.get(SURVEY_TWIN_EVENTS_PROBE.limitParam));
  const engineUrl = resolveSurveyTwinEventsEngineUrl();

  try {
    const res = await fetch(buildSurveyTwinEventsEngineUrl(engineUrl, limit, reportId || undefined), {
      signal: AbortSignal.timeout(SURVEY_TWIN_EVENTS_PROBE.fetchTimeoutMs),
    });
    const data = await res.json();
    if (!res.ok) {
      return json(
        { error: surveyTwinEventsErrorMessage(data) },
        allowed,
        SURVEY_TWIN_EVENTS_PROBE.engineErrorStatus,
      );
    }
    return json(buildSurveyTwinEventsSuccessPayload(data as Record<string, unknown>), allowed, 200);
  } catch {
    return json({ error: SURVEY_TWIN_EVENTS_PROBE.unreachableError }, allowed, SURVEY_TWIN_EVENTS_PROBE.unreachableStatus);
  }
}