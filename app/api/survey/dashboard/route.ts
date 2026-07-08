import { getAllowedOrigin } from '@/api/lib/cors';
import {
  buildSurveyDashboardUnreachablePayload,
  probeSurveyDashboard,
  resolveSurveyDashboardEngineUrl,
  SURVEY_DASHBOARD_PROBE,
  surveyDashboardHttpStatus,
} from '../../lib/surveyDashboard';

export { SURVEY_DASHBOARD_PATH, SURVEY_DASHBOARD_PROBE } from '@/api/lib/surveyDashboard';

export const config = { runtime: 'nodejs' };

function json(body: unknown, origin: string, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
      'Cache-Control': SURVEY_DASHBOARD_PROBE.cacheControl,
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
        'Access-Control-Allow-Methods': SURVEY_DASHBOARD_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, allowed, 405);
  }

  const engineUrl = resolveSurveyDashboardEngineUrl();
  const probe = await probeSurveyDashboard(engineUrl);
  if (!probe.ok) {
    return json(buildSurveyDashboardUnreachablePayload(engineUrl), allowed, SURVEY_DASHBOARD_PROBE.unreachableStatus);
  }

  return json(probe.data, allowed, surveyDashboardHttpStatus(probe.engineResponseOk));
}