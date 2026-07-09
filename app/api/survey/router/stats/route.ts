import { getAllowedOrigin } from '@/api/lib/cors';
import {
  buildSurveyRouterStatsEngineUrl,
  buildSurveyRouterStatsSuccessPayload,
  resolveSurveyRouterStatsEngineUrl,
  SURVEY_ROUTER_STATS_PROBE,
  surveyRouterStatsErrorMessage,
} from '../../../lib/surveyRouterStats';

export { SURVEY_ROUTER_STATS_PATH, SURVEY_ROUTER_STATS_PROBE } from '@/api/lib/surveyRouterStats';

export const config = { runtime: 'nodejs' };

function json(body: unknown, origin: string, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
      'Cache-Control': SURVEY_ROUTER_STATS_PROBE.cacheControl,
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
        'Access-Control-Allow-Methods': SURVEY_ROUTER_STATS_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, allowed, 405);
  }

  const engineUrl = resolveSurveyRouterStatsEngineUrl();

  try {
    const res = await fetch(buildSurveyRouterStatsEngineUrl(engineUrl), {
      signal: AbortSignal.timeout(SURVEY_ROUTER_STATS_PROBE.fetchTimeoutMs),
    });
    const data = await res.json();
    if (!res.ok) {
      return json(
        { error: surveyRouterStatsErrorMessage(data) },
        allowed,
        SURVEY_ROUTER_STATS_PROBE.engineErrorStatus,
      );
    }
    return json(buildSurveyRouterStatsSuccessPayload(data as Record<string, unknown>), allowed, 200);
  } catch {
    return json(
      { error: SURVEY_ROUTER_STATS_PROBE.unreachableError },
      allowed,
      SURVEY_ROUTER_STATS_PROBE.unreachableStatus,
    );
  }
}