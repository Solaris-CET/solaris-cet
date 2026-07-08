import { resolveSurveyEngineUrl, SURVEY_HEALTH_PROBE } from './surveyHealth';
import { parseSurveyTwinLimit, SURVEY_TWIN_UNREACHABLE_ERROR, surveyTwinDetailErrorMessage } from './surveyTwinShared';

export const SURVEY_TWIN_WEBHOOK_DELIVERIES_PATH = '/api/survey/twin-webhook/deliveries';
export const SURVEY_TWIN_WEBHOOK_DELIVERIES_METHODS = 'GET, OPTIONS';

export const SURVEY_TWIN_WEBHOOK_DELIVERIES_PROBE = {
  path: SURVEY_TWIN_WEBHOOK_DELIVERIES_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  cacheControl: 'no-store' as const,
  limitParam: 'limit' as const,
  directionParam: 'direction' as const,
  unavailableError: 'Deliveries unavailable' as const,
  unreachableError: SURVEY_TWIN_UNREACHABLE_ERROR,
  fetchTimeoutMs: 8000,
  unreachableStatus: 503,
  engineErrorStatus: 502,
  deliveriesEnginePath: '/twin-webhook/deliveries' as const,
};

export function parseSurveyTwinWebhookDeliveriesDirection(raw: string | null | undefined): string {
  return (raw ?? '').trim();
}

export function resolveSurveyTwinWebhookDeliveriesEngineUrl(env: NodeJS.ProcessEnv = process.env): string {
  return resolveSurveyEngineUrl(env);
}

export function buildSurveyTwinWebhookDeliveriesEngineUrl(
  engineUrl: string,
  limit: number,
  direction?: string,
): string {
  const qs = new URLSearchParams({ limit: String(limit) });
  if (direction) qs.set(SURVEY_TWIN_WEBHOOK_DELIVERIES_PROBE.directionParam, direction);
  return `${engineUrl.replace(/\/$/, '')}${SURVEY_TWIN_WEBHOOK_DELIVERIES_PROBE.deliveriesEnginePath}?${qs}`;
}

export function buildSurveyTwinWebhookDeliveriesSuccessPayload(data: Record<string, unknown>) {
  return {
    platform: SURVEY_HEALTH_PROBE.platform,
    ...data,
  };
}

export function surveyTwinWebhookDeliveriesErrorMessage(data: unknown): string {
  return surveyTwinDetailErrorMessage(data, SURVEY_TWIN_WEBHOOK_DELIVERIES_PROBE.unavailableError);
}

export { parseSurveyTwinLimit };