import { getAllowedOrigin } from '@/api/lib/cors';
import {
  buildSurveyCorrectionEngineBody,
  buildSurveyCorrectionsListUrl,
  buildSurveyCorrectionsPlatformPayload,
  buildSurveyCorrectionsPostUrl,
  buildSurveyCorrectionWebhookPayload,
  parseSurveyCorrectionPayload,
  resolveSurveyCorrectionsEngineUrl,
  SURVEY_CORRECTIONS_PROBE,
  surveyCorrectionErrorMessage,
} from '../../lib/surveyCorrections';
import { dispatchSurveyWebhook } from '@/api/lib/surveyWebhook';
import { dispatchTwinWebhook } from '@/api/lib/twinWebhook';

export { SURVEY_CORRECTIONS_PATH, SURVEY_CORRECTIONS_PROBE } from '@/api/lib/surveyCorrections';

export const config = { runtime: 'nodejs' };

function json(body: unknown, origin: string, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
      'Cache-Control': SURVEY_CORRECTIONS_PROBE.cacheControl,
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
        'Access-Control-Allow-Methods': SURVEY_CORRECTIONS_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': SURVEY_CORRECTIONS_PROBE.allowHeaders,
        Vary: 'Origin',
      },
    });
  }

  const engineUrl = resolveSurveyCorrectionsEngineUrl();

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const reportId = (url.searchParams.get(SURVEY_CORRECTIONS_PROBE.reportIdParam) || '').trim();
    try {
      const res = await fetch(buildSurveyCorrectionsListUrl(engineUrl, reportId), {
        signal: AbortSignal.timeout(SURVEY_CORRECTIONS_PROBE.fetchTimeoutMs),
      });
      const data = await res.json();
      if (!res.ok) return json({ error: SURVEY_CORRECTIONS_PROBE.unavailableError }, allowed, SURVEY_CORRECTIONS_PROBE.engineErrorStatus);
      return json(buildSurveyCorrectionsPlatformPayload(data as Record<string, unknown>), allowed, 200);
    } catch {
      return json({ error: SURVEY_CORRECTIONS_PROBE.unreachableError }, allowed, SURVEY_CORRECTIONS_PROBE.unreachableStatus);
    }
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, allowed, 405);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: SURVEY_CORRECTIONS_PROBE.invalidJsonError }, allowed, 400);
  }

  const correction = parseSurveyCorrectionPayload(body);
  if (!correction) {
    return json({ error: SURVEY_CORRECTIONS_PROBE.requiredFieldsError }, allowed, 400);
  }

  const installerKey = req.headers.get('x-installer-key') || '';

  try {
    const res = await fetch(buildSurveyCorrectionsPostUrl(engineUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(installerKey ? { [SURVEY_CORRECTIONS_PROBE.installerKeyHeader]: installerKey } : {}),
      },
      body: JSON.stringify(buildSurveyCorrectionEngineBody(correction)),
      signal: AbortSignal.timeout(SURVEY_CORRECTIONS_PROBE.fetchTimeoutMs),
    });
    const data = await res.json();
    if (!res.ok) {
      return json(
        { error: surveyCorrectionErrorMessage(data, SURVEY_CORRECTIONS_PROBE.correctionFailedFallback) },
        allowed,
        res.status === 400 ? 400 : SURVEY_CORRECTIONS_PROBE.engineErrorStatus,
      );
    }
    const webhookPayload = buildSurveyCorrectionWebhookPayload(correction);
    void dispatchSurveyWebhook({
      event: SURVEY_CORRECTIONS_PROBE.twinFeedEvent,
      ...webhookPayload,
    });
    void dispatchTwinWebhook({
      event: SURVEY_CORRECTIONS_PROBE.correctionLoggedEvent,
      ...webhookPayload,
    });
    return json(buildSurveyCorrectionsPlatformPayload(data as Record<string, unknown>), allowed, 200);
  } catch {
    return json({ error: SURVEY_CORRECTIONS_PROBE.unreachableError }, allowed, SURVEY_CORRECTIONS_PROBE.unreachableStatus);
  }
}