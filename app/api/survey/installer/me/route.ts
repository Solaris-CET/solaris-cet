import { getAllowedOrigin } from '@/api/lib/cors';
import {
  buildSurveyInstallerMeEngineUrl,
  buildSurveyInstallerMeHeaders,
  buildSurveyInstallerMeSuccessPayload,
  resolveSurveyInstallerMeEngineUrl,
  SURVEY_INSTALLER_ME_PROBE,
  surveyInstallerMeErrorMessage,
  surveyInstallerMeHttpStatus,
} from '../../../lib/surveyInstallerMe';

export { SURVEY_INSTALLER_ME_PATH, SURVEY_INSTALLER_ME_PROBE } from '@/api/lib/surveyInstallerMe';

export const config = { runtime: 'nodejs' };

function json(body: unknown, origin: string, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
      'Cache-Control': SURVEY_INSTALLER_ME_PROBE.cacheControl,
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
        'Access-Control-Allow-Methods': SURVEY_INSTALLER_ME_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': SURVEY_INSTALLER_ME_PROBE.allowHeaders,
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, allowed, 405);
  }

  const installerKey = req.headers.get('x-installer-key')?.trim() || '';
  const engineUrl = resolveSurveyInstallerMeEngineUrl();

  try {
    const res = await fetch(buildSurveyInstallerMeEngineUrl(engineUrl), {
      headers: buildSurveyInstallerMeHeaders(installerKey),
      signal: AbortSignal.timeout(SURVEY_INSTALLER_ME_PROBE.fetchTimeoutMs),
    });
    const data = await res.json();
    if (!res.ok) {
      return json(
        { error: surveyInstallerMeErrorMessage(data) },
        allowed,
        surveyInstallerMeHttpStatus(res.status),
      );
    }
    return json(buildSurveyInstallerMeSuccessPayload(data as Record<string, unknown>), allowed, 200);
  } catch {
    return json({ error: SURVEY_INSTALLER_ME_PROBE.unreachableError }, allowed, SURVEY_INSTALLER_ME_PROBE.unreachableStatus);
  }
}