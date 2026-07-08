import { getAllowedOrigin } from '@/api/lib/cors';
import {
  buildSurveyFilesEngineUrl,
  buildSurveyFilesUnreachablePayload,
  resolveSurveyFilesEngineUrl,
  safeSurveyFilePath,
  SURVEY_FILES_PROBE,
  surveyFileMediaType,
  surveyFilesHttpStatus,
} from '../../lib/surveyFiles';

export { SURVEY_FILES_PATH, SURVEY_FILES_PROBE } from '@/api/lib/surveyFiles';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const allowed = getAllowedOrigin(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowed,
        'Access-Control-Allow-Methods': SURVEY_FILES_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowed, Vary: 'Origin' },
    });
  }

  const url = new URL(req.url);
  const file = safeSurveyFilePath(url.searchParams.get(SURVEY_FILES_PROBE.fileParam));
  if (!file) {
    return new Response(JSON.stringify({ error: SURVEY_FILES_PROBE.invalidFileError }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowed, Vary: 'Origin' },
    });
  }

  const engineUrl = resolveSurveyFilesEngineUrl();

  try {
    const res = await fetch(buildSurveyFilesEngineUrl(engineUrl, file), {
      signal: AbortSignal.timeout(SURVEY_FILES_PROBE.fetchTimeoutMs),
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: SURVEY_FILES_PROBE.notFoundError }), {
        status: surveyFilesHttpStatus(res.status),
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowed, Vary: 'Origin' },
      });
    }

    const buf = await res.arrayBuffer();
    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': surveyFileMediaType(file),
        'Content-Disposition': `attachment; filename="${file}"`,
        'Access-Control-Allow-Origin': allowed,
        Vary: 'Origin',
        'Cache-Control': SURVEY_FILES_PROBE.cacheControl,
      },
    });
  } catch {
    return new Response(JSON.stringify(buildSurveyFilesUnreachablePayload(engineUrl)), {
      status: SURVEY_FILES_PROBE.unreachableStatus,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowed, Vary: 'Origin' },
    });
  }
}