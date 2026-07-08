import { getAllowedOrigin } from '@/api/lib/cors';
import {
  buildSurveyTwinWebhookEngineBody,
  buildSurveyTwinWebhookInboundEngineUrl,
  buildSurveyTwinWebhookInboundHeaders,
  buildSurveyTwinWebhookSuccessPayload,
  parseTwinWebhookInboundBody,
  readTwinWebhookSecret,
  resolveSurveyTwinWebhookEngineUrl,
  SURVEY_TWIN_WEBHOOK_PROBE,
  surveyTwinWebhookInboundErrorMessage,
  surveyTwinWebhookInboundHttpStatus,
  validateTwinWebhookSecret,
} from '../../lib/surveyTwinWebhookInbound';

export { SURVEY_TWIN_WEBHOOK_PATH, SURVEY_TWIN_WEBHOOK_PROBE } from '@/api/lib/surveyTwinWebhookInbound';

export const config = { runtime: 'nodejs' };

function json(body: unknown, origin: string, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
      'Cache-Control': SURVEY_TWIN_WEBHOOK_PROBE.cacheControl,
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
        'Access-Control-Allow-Methods': SURVEY_TWIN_WEBHOOK_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': SURVEY_TWIN_WEBHOOK_PROBE.allowHeaders,
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, allowed, 405);
  }

  if (!validateTwinWebhookSecret(req)) {
    return json({ error: SURVEY_TWIN_WEBHOOK_PROBE.invalidSecretError }, allowed, SURVEY_TWIN_WEBHOOK_PROBE.unauthorizedStatus);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: SURVEY_TWIN_WEBHOOK_PROBE.invalidJsonError }, allowed, 400);
  }

  const parsed = parseTwinWebhookInboundBody(body);
  if (!parsed) {
    return json({ error: SURVEY_TWIN_WEBHOOK_PROBE.missingReportIdError }, allowed, 400);
  }

  const engineUrl = resolveSurveyTwinWebhookEngineUrl();
  const secret = readTwinWebhookSecret();

  try {
    const res = await fetch(buildSurveyTwinWebhookInboundEngineUrl(engineUrl), {
      method: 'POST',
      headers: buildSurveyTwinWebhookInboundHeaders(secret),
      body: JSON.stringify(buildSurveyTwinWebhookEngineBody(parsed)),
      signal: AbortSignal.timeout(SURVEY_TWIN_WEBHOOK_PROBE.fetchTimeoutMs),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return json(
        { error: surveyTwinWebhookInboundErrorMessage(data) },
        allowed,
        surveyTwinWebhookInboundHttpStatus(res.status),
      );
    }
    return json(buildSurveyTwinWebhookSuccessPayload(data as Record<string, unknown>), allowed, 200);
  } catch {
    return json({ error: SURVEY_TWIN_WEBHOOK_PROBE.unreachableError }, allowed, SURVEY_TWIN_WEBHOOK_PROBE.unreachableStatus);
  }
}