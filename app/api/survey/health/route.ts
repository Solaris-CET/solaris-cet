import { getAllowedOrigin } from '@/api/lib/cors';
import {
  buildSurveyHealthSuccessPayload,
  buildSurveyHealthUnreachablePayload,
  probeSurveyEngineHealth,
  resolveSurveyEngineUrl,
  SURVEY_HEALTH_PROBE,
  surveyHealthHttpStatus,
} from '../../lib/surveyHealth';

export { SURVEY_HEALTH_PATH, SURVEY_HEALTH_PROBE } from '@/api/lib/surveyHealth';

export const config = { runtime: 'nodejs' };

function json(body: unknown, origin: string, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
      'Cache-Control': SURVEY_HEALTH_PROBE.cacheControl,
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
        'Access-Control-Allow-Methods': SURVEY_HEALTH_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, allowed, 405);
  }

  const engineUrl = resolveSurveyEngineUrl();
  const probe = await probeSurveyEngineHealth(engineUrl);
  if (!probe.ok) {
    return json(buildSurveyHealthUnreachablePayload(engineUrl), allowed, SURVEY_HEALTH_PROBE.unreachableStatus);
  }

  return json(
    buildSurveyHealthSuccessPayload(probe.data, engineUrl),
    allowed,
    surveyHealthHttpStatus(probe.engineResponseOk),
  );
}