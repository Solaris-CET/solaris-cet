import { getAllowedOrigin } from '@/api/lib/cors';
import {
  buildSurveyJurisdictionsUnreachablePayload,
  probeSurveyJurisdictions,
  resolveSurveyJurisdictionsEngineUrl,
  SURVEY_JURISDICTIONS_PROBE,
  surveyJurisdictionsHttpStatus,
} from '../../lib/surveyJurisdictions';

export { SURVEY_JURISDICTIONS_PATH, SURVEY_JURISDICTIONS_PROBE } from '@/api/lib/surveyJurisdictions';

export const config = { runtime: 'nodejs' };

function json(body: unknown, origin: string, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
      'Cache-Control': SURVEY_JURISDICTIONS_PROBE.cacheControl,
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
        'Access-Control-Allow-Methods': SURVEY_JURISDICTIONS_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, allowed, 405);
  }

  const engineUrl = resolveSurveyJurisdictionsEngineUrl();
  const probe = await probeSurveyJurisdictions(engineUrl);
  if (!probe.ok) {
    return json(buildSurveyJurisdictionsUnreachablePayload(), allowed, SURVEY_JURISDICTIONS_PROBE.unreachableStatus);
  }

  return json(probe.data, allowed, surveyJurisdictionsHttpStatus(probe.engineResponseOk));
}