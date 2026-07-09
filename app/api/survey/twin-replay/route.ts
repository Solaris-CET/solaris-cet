import { getAllowedOrigin } from '@/api/lib/cors';
import {
  buildSurveyTwinReplayEngineUrl,
  buildSurveyTwinReplaySuccessPayload,
  parseSurveyTwinLimit,
  parseSurveyTwinReplayFromSeq,
  parseSurveyTwinReplayReportId,
  resolveSurveyTwinReplayEngineUrl,
  SURVEY_TWIN_REPLAY_PROBE,
  surveyTwinReplayErrorMessage,
} from '../../lib/surveyTwinReplay';

export { SURVEY_TWIN_REPLAY_PATH, SURVEY_TWIN_REPLAY_PROBE } from '@/api/lib/surveyTwinReplay';

export const config = { runtime: 'nodejs' };

function json(body: unknown, origin: string, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
      'Cache-Control': SURVEY_TWIN_REPLAY_PROBE.cacheControl,
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
        'Access-Control-Allow-Methods': SURVEY_TWIN_REPLAY_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, allowed, 405);
  }

  const url = new URL(req.url);
  const reportId = parseSurveyTwinReplayReportId(url.searchParams.get(SURVEY_TWIN_REPLAY_PROBE.reportIdParam));
  const limit = parseSurveyTwinLimit(url.searchParams.get(SURVEY_TWIN_REPLAY_PROBE.limitParam));
  const fromSeq = parseSurveyTwinReplayFromSeq(url.searchParams.get(SURVEY_TWIN_REPLAY_PROBE.fromSeqParam));
  const engineUrl = resolveSurveyTwinReplayEngineUrl();

  try {
    const res = await fetch(
      buildSurveyTwinReplayEngineUrl(engineUrl, fromSeq, limit, reportId || undefined),
      { signal: AbortSignal.timeout(SURVEY_TWIN_REPLAY_PROBE.fetchTimeoutMs) },
    );
    const data = await res.json();
    if (!res.ok) {
      return json(
        { error: surveyTwinReplayErrorMessage(data) },
        allowed,
        SURVEY_TWIN_REPLAY_PROBE.engineErrorStatus,
      );
    }
    return json(buildSurveyTwinReplaySuccessPayload(data as Record<string, unknown>), allowed, 200);
  } catch {
    return json(
      { error: SURVEY_TWIN_REPLAY_PROBE.unreachableError },
      allowed,
      SURVEY_TWIN_REPLAY_PROBE.unreachableStatus,
    );
  }
}