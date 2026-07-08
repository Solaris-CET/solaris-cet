import { resolveSurveyEngineUrl, SURVEY_HEALTH_PROBE } from './surveyHealth';
import {
  parseSurveyTwinReportId,
  SURVEY_TWIN_MISSING_REPORT_ID_ERROR,
  SURVEY_TWIN_REPORT_ID_PARAM,
  SURVEY_TWIN_UNREACHABLE_ERROR,
  surveyTwinDetailErrorMessage,
} from './surveyTwinShared';

export const SURVEY_TWIN_AGENT_EXECUTE_PATH = '/api/survey/twin-agent/execute';
export const SURVEY_TWIN_AGENT_EXECUTE_METHODS = 'POST, OPTIONS';

export const SURVEY_TWIN_AGENT_EXECUTE_PROBE = {
  path: SURVEY_TWIN_AGENT_EXECUTE_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  cacheControl: 'no-store' as const,
  installerKeyHeader: 'X-Installer-Key' as const,
  allowHeaders: 'Content-Type, X-Installer-Key' as const,
  reportIdParam: SURVEY_TWIN_REPORT_ID_PARAM,
  missingReportIdError: SURVEY_TWIN_MISSING_REPORT_ID_ERROR,
  invalidJsonError: 'JSON invalid' as const,
  requiredActionFieldsError: 'action_id and action_type required' as const,
  executeFailedFallback: 'Twin agent execute failed' as const,
  unreachableError: SURVEY_TWIN_UNREACHABLE_ERROR,
  defaultExecutedBy: 'technician' as const,
  surveyWebhookEvent: 'agent_action' as const,
  twinWebhookEvent: 'agent_action' as const,
  fetchTimeoutMs: 12_000,
  unreachableStatus: 503,
  engineErrorStatus: 502,
};

export type ParsedSurveyTwinExecuteBody = {
  actionId: string;
  actionType: string;
  executedBy: string;
  detail: string;
};

export function parseSurveyTwinExecuteReportId(raw: string | null | undefined): string | null {
  return parseSurveyTwinReportId(raw, true);
}

export function parseSurveyTwinExecuteBody(body: unknown): ParsedSurveyTwinExecuteBody | null {
  if (!body || typeof body !== 'object') return null;
  const rec = body as Record<string, unknown>;
  const actionId = String(rec.action_id ?? '').trim();
  const actionType = String(rec.action_type ?? '').trim();
  if (!actionId || !actionType) return null;
  return {
    actionId,
    actionType,
    executedBy: typeof rec.executed_by === 'string' ? rec.executed_by : SURVEY_TWIN_AGENT_EXECUTE_PROBE.defaultExecutedBy,
    detail: typeof rec.detail === 'string' ? rec.detail : '',
  };
}

export function resolveSurveyTwinAgentExecuteEngineUrl(env: NodeJS.ProcessEnv = process.env): string {
  return resolveSurveyEngineUrl(env);
}

export function buildSurveyTwinAgentExecuteEngineUrl(engineUrl: string, reportId: string): string {
  return `${engineUrl.replace(/\/$/, '')}/twin-agent/${encodeURIComponent(reportId)}/execute`;
}

export function buildSurveyTwinExecuteEngineBody(parsed: ParsedSurveyTwinExecuteBody) {
  return {
    action_id: parsed.actionId,
    action_type: parsed.actionType,
    executed_by: parsed.executedBy,
    detail: parsed.detail,
  };
}

export function buildSurveyTwinExecuteWebhookPayload(reportId: string, parsed: ParsedSurveyTwinExecuteBody) {
  return {
    report_id: reportId,
    action_id: parsed.actionId,
    action_type: parsed.actionType,
  };
}

export function buildSurveyTwinAgentExecuteSuccessPayload(data: Record<string, unknown>) {
  return {
    platform: SURVEY_HEALTH_PROBE.platform,
    ...data,
  };
}

export function surveyTwinAgentExecuteErrorMessage(data: unknown): string {
  return surveyTwinDetailErrorMessage(data, SURVEY_TWIN_AGENT_EXECUTE_PROBE.executeFailedFallback);
}

export function surveyTwinAgentExecuteHttpStatus(engineStatus: number): number {
  return engineStatus === 400 ? 400 : SURVEY_TWIN_AGENT_EXECUTE_PROBE.engineErrorStatus;
}