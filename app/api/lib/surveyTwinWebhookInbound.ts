import { resolveSurveyEngineUrl, SURVEY_HEALTH_PROBE } from './surveyHealth';

export const SURVEY_TWIN_WEBHOOK_PATH = '/api/survey/twin-webhook';
export const SURVEY_TWIN_WEBHOOK_METHODS = 'POST, OPTIONS';

export const SURVEY_TWIN_WEBHOOK_PROBE = {
  path: SURVEY_TWIN_WEBHOOK_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  cacheControl: 'no-store' as const,
  secretHeader: 'X-Twin-Webhook-Secret' as const,
  allowHeaders: 'Content-Type, X-Twin-Webhook-Secret' as const,
  invalidSecretError: 'Invalid twin webhook secret' as const,
  invalidJsonError: 'JSON invalid' as const,
  missingReportIdError: 'report_id required' as const,
  defaultEvent: 'crm_sync' as const,
  inboundFailedFallback: 'Inbound twin webhook failed' as const,
  unreachableError: 'survey-engine unreachable' as const,
  fetchTimeoutMs: 12_000,
  unauthorizedStatus: 401,
  unreachableStatus: 503,
  engineErrorStatus: 502,
  inboundEnginePath: '/twin-webhook/inbound' as const,
};

export type ParsedTwinWebhookInbound = {
  reportId: string;
  event: string;
  payload: Record<string, unknown>;
};

export function readTwinWebhookSecret(env: NodeJS.ProcessEnv = process.env): string {
  return String(env.TWIN_WEBHOOK_SECRET ?? '').trim();
}

export function validateTwinWebhookSecret(req: Request, expected = readTwinWebhookSecret()): boolean {
  if (!expected) return true;
  const got = String(req.headers.get('x-twin-webhook-secret') ?? '').trim();
  return got === expected;
}

export function parseTwinWebhookInboundBody(body: unknown): ParsedTwinWebhookInbound | null {
  if (!body || typeof body !== 'object') return null;
  const rec = body as Record<string, unknown>;
  const reportId = String(rec.report_id ?? rec.reportId ?? '').trim();
  if (!reportId) return null;
  const event = String(rec.event ?? rec.event_type ?? SURVEY_TWIN_WEBHOOK_PROBE.defaultEvent).trim();
  const { report_id: _r, reportId: _r2, event: _e, event_type: _e2, ...rest } = rec;
  return { reportId, event, payload: rest };
}

export function resolveSurveyTwinWebhookEngineUrl(env: NodeJS.ProcessEnv = process.env): string {
  return resolveSurveyEngineUrl(env);
}

export function buildSurveyTwinWebhookInboundEngineUrl(engineUrl: string): string {
  return `${engineUrl.replace(/\/$/, '')}${SURVEY_TWIN_WEBHOOK_PROBE.inboundEnginePath}`;
}

export function buildSurveyTwinWebhookEngineBody(parsed: ParsedTwinWebhookInbound) {
  return {
    report_id: parsed.reportId,
    event: parsed.event,
    payload: parsed.payload,
  };
}

export function buildSurveyTwinWebhookInboundHeaders(secret: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...(secret ? { [SURVEY_TWIN_WEBHOOK_PROBE.secretHeader]: secret } : {}),
  };
}

export function buildSurveyTwinWebhookSuccessPayload(data: Record<string, unknown>) {
  return {
    platform: SURVEY_HEALTH_PROBE.platform,
    ...data,
  };
}

export function surveyTwinWebhookInboundErrorMessage(data: unknown): string {
  if (data && typeof data === 'object' && 'detail' in data && typeof (data as { detail?: unknown }).detail === 'string') {
    return (data as { detail: string }).detail;
  }
  return SURVEY_TWIN_WEBHOOK_PROBE.inboundFailedFallback;
}

export function surveyTwinWebhookInboundHttpStatus(engineStatus: number): number {
  return engineStatus === 400 ? 400 : SURVEY_TWIN_WEBHOOK_PROBE.engineErrorStatus;
}