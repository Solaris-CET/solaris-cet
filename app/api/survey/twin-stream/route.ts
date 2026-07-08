import { getAllowedOrigin } from '@/api/lib/cors';
import {
  buildSurveyTwinStreamEngineUrl,
  buildSurveyTwinStreamErrorPayload,
  buildSurveyTwinStreamFetchOptions,
  buildSurveyTwinStreamResponseHeaders,
  parseSurveyTwinStreamPersistent,
  parseSurveyTwinStreamReportId,
  resolveSurveyTwinStreamEngineUrl,
  SURVEY_TWIN_STREAM_PROBE,
  surveyTwinStreamErrorMessage,
  surveyTwinStreamHttpStatus,
} from '../../lib/surveyTwinStream';

export { SURVEY_TWIN_STREAM_PATH, SURVEY_TWIN_STREAM_PROBE } from '@/api/lib/surveyTwinStream';

export const config = { runtime: 'nodejs' };

function json(body: unknown, origin: string, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
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
        'Access-Control-Allow-Methods': SURVEY_TWIN_STREAM_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, allowed, 405);
  }

  const url = new URL(req.url);
  const reportId = parseSurveyTwinStreamReportId(url.searchParams.get(SURVEY_TWIN_STREAM_PROBE.reportIdParam));
  if (!reportId) {
    return json({ error: SURVEY_TWIN_STREAM_PROBE.missingReportIdError }, allowed, 400);
  }

  const persistent = parseSurveyTwinStreamPersistent(url.searchParams.get(SURVEY_TWIN_STREAM_PROBE.persistentParam));
  const engineUrl = resolveSurveyTwinStreamEngineUrl();

  try {
    const res = await fetch(
      buildSurveyTwinStreamEngineUrl(engineUrl, reportId, persistent),
      buildSurveyTwinStreamFetchOptions(persistent),
    );
    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => ({}));
      return json(
        buildSurveyTwinStreamErrorPayload(surveyTwinStreamErrorMessage(data)),
        allowed,
        surveyTwinStreamHttpStatus(res.status),
      );
    }
    return new Response(res.body, {
      status: 200,
      headers: buildSurveyTwinStreamResponseHeaders(allowed),
    });
  } catch {
    return json(
      buildSurveyTwinStreamErrorPayload(SURVEY_TWIN_STREAM_PROBE.unreachableError),
      allowed,
      SURVEY_TWIN_STREAM_PROBE.unreachableStatus,
    );
  }
}