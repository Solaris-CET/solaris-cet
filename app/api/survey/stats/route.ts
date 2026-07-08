import { getAllowedOrigin } from '@/api/lib/cors';
import {
  buildSurveyStatsSuccessPayload,
  buildSurveyStatsUnreachablePayload,
  probeSurveyStats,
  resolveSurveyStatsEngineUrl,
  SURVEY_STATS_PROBE,
} from '../../lib/surveyStats';

export { SURVEY_STATS_PATH, SURVEY_STATS_PROBE } from '@/api/lib/surveyStats';

export const config = { runtime: 'nodejs' };

function json(body: unknown, origin: string, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
      'Cache-Control': SURVEY_STATS_PROBE.cacheControl,
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
        'Access-Control-Allow-Methods': SURVEY_STATS_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, allowed, 405);
  }

  const engineUrl = resolveSurveyStatsEngineUrl();
  const probe = await probeSurveyStats(engineUrl);
  if (!probe.ok) {
    return json(buildSurveyStatsUnreachablePayload(), allowed, SURVEY_STATS_PROBE.unreachableStatus);
  }
  if (!probe.engineResponseOk) {
    return json({ error: SURVEY_STATS_PROBE.unavailableError }, allowed, SURVEY_STATS_PROBE.engineErrorStatus);
  }

  return json(buildSurveyStatsSuccessPayload(probe.data), allowed, 200);
}