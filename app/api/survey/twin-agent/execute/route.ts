import { getAllowedOrigin } from '@/api/lib/cors';
import {
  buildSurveyTwinAgentExecuteEngineUrl,
  buildSurveyTwinAgentExecuteSuccessPayload,
  buildSurveyTwinExecuteEngineBody,
  buildSurveyTwinExecuteWebhookPayload,
  parseSurveyTwinExecuteBody,
  parseSurveyTwinExecuteReportId,
  resolveSurveyTwinAgentExecuteEngineUrl,
  SURVEY_TWIN_AGENT_EXECUTE_PROBE,
  surveyTwinAgentExecuteErrorMessage,
  surveyTwinAgentExecuteHttpStatus,
} from '../../../lib/surveyTwinAgentExecute';
import { dispatchSurveyWebhook } from '@/api/lib/surveyWebhook';
import { dispatchTwinWebhook } from '@/api/lib/twinWebhook';

export { SURVEY_TWIN_AGENT_EXECUTE_PATH, SURVEY_TWIN_AGENT_EXECUTE_PROBE } from '@/api/lib/surveyTwinAgentExecute';

export const config = { runtime: 'nodejs' };

function json(body: unknown, origin: string, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
      'Cache-Control': SURVEY_TWIN_AGENT_EXECUTE_PROBE.cacheControl,
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
        'Access-Control-Allow-Methods': SURVEY_TWIN_AGENT_EXECUTE_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': SURVEY_TWIN_AGENT_EXECUTE_PROBE.allowHeaders,
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, allowed, 405);
  }

  const url = new URL(req.url);
  const reportId = parseSurveyTwinExecuteReportId(url.searchParams.get(SURVEY_TWIN_AGENT_EXECUTE_PROBE.reportIdParam));
  if (!reportId) {
    return json({ error: SURVEY_TWIN_AGENT_EXECUTE_PROBE.missingReportIdError }, allowed, 400);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: SURVEY_TWIN_AGENT_EXECUTE_PROBE.invalidJsonError }, allowed, 400);
  }

  const parsed = parseSurveyTwinExecuteBody(body);
  if (!parsed) {
    return json({ error: SURVEY_TWIN_AGENT_EXECUTE_PROBE.requiredActionFieldsError }, allowed, 400);
  }

  const installerKey = req.headers.get('x-installer-key') ?? '';
  const engineUrl = resolveSurveyTwinAgentExecuteEngineUrl();

  try {
    const res = await fetch(buildSurveyTwinAgentExecuteEngineUrl(engineUrl, reportId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(installerKey ? { [SURVEY_TWIN_AGENT_EXECUTE_PROBE.installerKeyHeader]: installerKey } : {}),
      },
      body: JSON.stringify(buildSurveyTwinExecuteEngineBody(parsed)),
      signal: AbortSignal.timeout(SURVEY_TWIN_AGENT_EXECUTE_PROBE.fetchTimeoutMs),
    });
    const data = await res.json();
    if (!res.ok) {
      return json(
        { error: surveyTwinAgentExecuteErrorMessage(data) },
        allowed,
        surveyTwinAgentExecuteHttpStatus(res.status),
      );
    }

    const webhookPayload = buildSurveyTwinExecuteWebhookPayload(reportId, parsed);
    void dispatchSurveyWebhook({
      event: SURVEY_TWIN_AGENT_EXECUTE_PROBE.surveyWebhookEvent,
      ...webhookPayload,
    });
    void dispatchTwinWebhook({
      event: SURVEY_TWIN_AGENT_EXECUTE_PROBE.twinWebhookEvent,
      ...webhookPayload,
    });

    return json(buildSurveyTwinAgentExecuteSuccessPayload(data as Record<string, unknown>), allowed, 200);
  } catch {
    return json({ error: SURVEY_TWIN_AGENT_EXECUTE_PROBE.unreachableError }, allowed, SURVEY_TWIN_AGENT_EXECUTE_PROBE.unreachableStatus);
  }
}