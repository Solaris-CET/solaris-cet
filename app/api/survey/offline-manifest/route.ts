import { getAllowedOrigin } from '@/api/lib/cors';
import {
  buildSurveyOfflineManifest,
  buildSurveyOfflineManifestResponse,
  fetchSurveyOfflineEngineHints,
  resolveSurveyOfflineManifestEngineUrl,
  SURVEY_OFFLINE_MANIFEST_PROBE,
} from '../../lib/surveyOfflineManifest';

export {
  SURVEY_OFFLINE_MANIFEST_PATH,
  SURVEY_OFFLINE_MANIFEST_PROBE,
  SURVEY_OFFLINE_SCHEMA,
} from '../../lib/surveyOfflineManifest';

export const config = { runtime: 'nodejs' };

function json(body: unknown, origin: string, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
      'Cache-Control': SURVEY_OFFLINE_MANIFEST_PROBE.cacheControl,
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
        'Access-Control-Allow-Methods': SURVEY_OFFLINE_MANIFEST_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, allowed, 405);
  }

  const engineUrl = resolveSurveyOfflineManifestEngineUrl();
  const engineHints = await fetchSurveyOfflineEngineHints(engineUrl);
  const manifest = buildSurveyOfflineManifest(engineHints);

  return json(buildSurveyOfflineManifestResponse(manifest), allowed, 200);
}