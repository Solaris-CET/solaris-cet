import { parseSurveyContextReportId } from './surveyContext';
import { resolveSurveyEngineUrl, SURVEY_HEALTH_PROBE } from './surveyHealth';

export const SURVEY_ORCHESTRATE_PATH = '/api/survey/orchestrate';
export const SURVEY_ORCHESTRATE_METHODS = 'GET, OPTIONS';

export const SURVEY_ORCHESTRATE_PROBE = {
  path: SURVEY_ORCHESTRATE_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  cacheControl: 'private, max-age=60' as const,
  reportIdParam: 'report_id' as const,
  missingReportIdError: 'report_id required' as const,
  unavailableError: 'Orchestration unavailable' as const,
  unreachableError: 'survey-engine unreachable' as const,
  fetchTimeoutMs: 8000,
  notFoundStatus: 404,
  unreachableStatus: 503,
  engineErrorStatus: 502,
};

export function parseSurveyOrchestrateReportId(raw: string | null | undefined): string | null {
  return parseSurveyContextReportId(raw);
}

export function resolveSurveyOrchestrateEngineUrl(env: NodeJS.ProcessEnv = process.env): string {
  return resolveSurveyEngineUrl(env);
}

export function buildSurveyOrchestrateEngineUrl(engineUrl: string, reportId: string): string {
  return `${engineUrl.replace(/\/$/, '')}/orchestrate/${encodeURIComponent(reportId)}`;
}

export function buildSurveyOrchestrateSuccessPayload(orchestration: unknown) {
  return {
    platform: SURVEY_HEALTH_PROBE.platform,
    orchestration,
  };
}

export function surveyOrchestrateHttpStatus(engineStatus: number): number {
  return engineStatus === SURVEY_ORCHESTRATE_PROBE.notFoundStatus
    ? SURVEY_ORCHESTRATE_PROBE.notFoundStatus
    : SURVEY_ORCHESTRATE_PROBE.engineErrorStatus;
}

export function surveyOrchestrateErrorMessage(data: unknown): string {
  if (data && typeof data === 'object' && 'detail' in data && typeof (data as { detail?: unknown }).detail === 'string') {
    return (data as { detail: string }).detail;
  }
  return SURVEY_ORCHESTRATE_PROBE.unavailableError;
}

export type SurveyOrchestrateProbeResult =
  | { ok: true; data: unknown; status: number }
  | { ok: false; unreachable: true };

export async function probeSurveyOrchestrate(
  engineUrl: string,
  reportId: string,
  fetchFn: typeof fetch = fetch,
): Promise<SurveyOrchestrateProbeResult> {
  try {
    const res = await fetchFn(buildSurveyOrchestrateEngineUrl(engineUrl, reportId), {
      signal: AbortSignal.timeout(SURVEY_ORCHESTRATE_PROBE.fetchTimeoutMs),
    });
    const data = await res.json();
    return { ok: true, data, status: res.status };
  } catch {
    return { ok: false, unreachable: true };
  }
}