import { getAllowedOrigin } from '@/api/lib/cors';
import {
  buildSurveyTwinFeedSuccessPayload,
  parseSurveyTwinFeedReportId,
  probeSurveyTwinFeed,
  resolveSurveyTwinFeedEngineUrl,
  SURVEY_TWIN_FEED_PROBE,
  surveyTwinFeedErrorMessage,
  surveyTwinFeedHttpStatus,
} from '../../lib/surveyTwinFeed';

export { SURVEY_TWIN_FEED_PATH, SURVEY_TWIN_FEED_PROBE } from '@/api/lib/surveyTwinFeed';

export const config = { runtime: 'nodejs' };

function json(body: unknown, origin: string, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
      'Cache-Control': SURVEY_TWIN_FEED_PROBE.cacheControl,
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
        'Access-Control-Allow-Methods': SURVEY_TWIN_FEED_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, allowed, 405);
  }

  const url = new URL(req.url);
  const reportId = parseSurveyTwinFeedReportId(url.searchParams.get(SURVEY_TWIN_FEED_PROBE.reportIdParam));
  if (!reportId) {
    return json({ error: SURVEY_TWIN_FEED_PROBE.missingReportIdError }, allowed, 400);
  }

  const engineUrl = resolveSurveyTwinFeedEngineUrl();
  const probe = await probeSurveyTwinFeed(engineUrl, reportId);
  if (!probe.ok) {
    return json({ error: SURVEY_TWIN_FEED_PROBE.unreachableError }, allowed, SURVEY_TWIN_FEED_PROBE.unreachableStatus);
  }
  if (probe.status !== 200) {
    return json(
      { error: surveyTwinFeedErrorMessage(probe.data) },
      allowed,
      surveyTwinFeedHttpStatus(probe.status),
    );
  }

  return json(buildSurveyTwinFeedSuccessPayload(probe.data), allowed, 200);
}