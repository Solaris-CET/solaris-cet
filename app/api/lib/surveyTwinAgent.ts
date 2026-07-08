import { resolveSurveyEngineUrl, SURVEY_HEALTH_PROBE } from './surveyHealth';
import {
  parseSurveyTwinReportId,
  SURVEY_TWIN_MISSING_REPORT_ID_ERROR,
  SURVEY_TWIN_REPORT_ID_PARAM,
  SURVEY_TWIN_UNREACHABLE_ERROR,
  surveyTwinDetailErrorMessage,
} from './surveyTwinShared';

export const SURVEY_TWIN_AGENT_PATH = '/api/survey/twin-agent';
export const SURVEY_TWIN_AGENT_METHODS = 'GET, OPTIONS';

export const SURVEY_TWIN_AGENT_PROBE = {
  path: SURVEY_TWIN_AGENT_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  cacheControl: 'no-store' as const,
  reportIdParam: SURVEY_TWIN_REPORT_ID_PARAM,
  missingReportIdError: SURVEY_TWIN_MISSING_REPORT_ID_ERROR,
  unavailableError: 'Twin agent unavailable' as const,
  unreachableError: SURVEY_TWIN_UNREACHABLE_ERROR,
  fetchTimeoutMs: 12_000,
  notFoundStatus: 404,
  unreachableStatus: 503,
  engineErrorStatus: 502,
};

export function parseSurveyTwinAgentReportId(raw: string | null | undefined): string | null {
  return parseSurveyTwinReportId(raw, true);
}

export function resolveSurveyTwinAgentEngineUrl(env: NodeJS.ProcessEnv = process.env): string {
  return resolveSurveyEngineUrl(env);
}

export function buildSurveyTwinAgentEngineUrl(engineUrl: string, reportId: string): string {
  return `${engineUrl.replace(/\/$/, '')}/twin-agent/${encodeURIComponent(reportId)}`;
}

export function buildSurveyTwinAgentSuccessPayload(plan: unknown) {
  return {
    platform: SURVEY_HEALTH_PROBE.platform,
    plan,
  };
}

export function surveyTwinAgentHttpStatus(engineStatus: number): number {
  return engineStatus === SURVEY_TWIN_AGENT_PROBE.notFoundStatus
    ? SURVEY_TWIN_AGENT_PROBE.notFoundStatus
    : SURVEY_TWIN_AGENT_PROBE.engineErrorStatus;
}

export function surveyTwinAgentErrorMessage(data: unknown): string {
  return surveyTwinDetailErrorMessage(data, SURVEY_TWIN_AGENT_PROBE.unavailableError);
}

export type SurveyTwinAgentProbeResult =
  | { ok: true; data: unknown; status: number }
  | { ok: false; unreachable: true };

export async function probeSurveyTwinAgent(
  engineUrl: string,
  reportId: string,
  fetchFn: typeof fetch = fetch,
): Promise<SurveyTwinAgentProbeResult> {
  try {
    const res = await fetchFn(buildSurveyTwinAgentEngineUrl(engineUrl, reportId), {
      signal: AbortSignal.timeout(SURVEY_TWIN_AGENT_PROBE.fetchTimeoutMs),
    });
    const data = await res.json();
    return { ok: true, data, status: res.status };
  } catch {
    return { ok: false, unreachable: true };
  }
}