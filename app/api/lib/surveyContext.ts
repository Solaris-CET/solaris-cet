import { resolveSurveyEngineUrl, SURVEY_HEALTH_PROBE } from './surveyHealth';

export const SURVEY_CONTEXT_PATH = '/api/survey/context';
export const SURVEY_CONTEXT_METHODS = 'GET, OPTIONS';

export const SURVEY_CONTEXT_PROBE = {
  path: SURVEY_CONTEXT_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  cacheControl: 'private, max-age=60' as const,
  reportIdParam: 'report_id' as const,
  maxReportIdLength: 80,
  missingReportIdError: 'report_id required' as const,
  unavailableError: 'Context unavailable' as const,
  unreachableError: 'survey-engine unreachable' as const,
  fetchTimeoutMs: 8000,
  notFoundStatus: 404,
  unreachableStatus: 503,
  engineErrorStatus: 502,
};

export function parseSurveyContextReportId(raw: string | null | undefined): string | null {
  const reportId = (raw ?? '').trim();
  if (!reportId || reportId.length > SURVEY_CONTEXT_PROBE.maxReportIdLength) return null;
  return reportId;
}

export function buildSurveyContextEngineUrl(engineUrl: string, reportId: string): string {
  return `${engineUrl.replace(/\/$/, '')}/context/${encodeURIComponent(reportId)}`;
}

export function buildSurveyContextSuccessPayload(context: unknown) {
  return {
    platform: SURVEY_HEALTH_PROBE.platform,
    context,
  };
}

export function resolveSurveyContextEngineUrl(env: NodeJS.ProcessEnv = process.env): string {
  return resolveSurveyEngineUrl(env);
}

export type SurveyContextProbeResult =
  | { ok: true; data: unknown; status: number }
  | { ok: false; unreachable: true };

export async function probeSurveyContext(
  engineUrl: string,
  reportId: string,
  fetchFn: typeof fetch = fetch,
): Promise<SurveyContextProbeResult> {
  try {
    const res = await fetchFn(buildSurveyContextEngineUrl(engineUrl, reportId), {
      signal: AbortSignal.timeout(SURVEY_CONTEXT_PROBE.fetchTimeoutMs),
    });
    const data = await res.json();
    return { ok: true, data, status: res.status };
  } catch {
    return { ok: false, unreachable: true };
  }
}

export function surveyContextHttpStatus(engineStatus: number): number {
  if (engineStatus === SURVEY_CONTEXT_PROBE.notFoundStatus) return SURVEY_CONTEXT_PROBE.notFoundStatus;
  return SURVEY_CONTEXT_PROBE.engineErrorStatus;
}

export function surveyContextErrorMessage(data: unknown): string {
  if (data && typeof data === 'object' && 'detail' in data && typeof (data as { detail?: unknown }).detail === 'string') {
    return (data as { detail: string }).detail;
  }
  return SURVEY_CONTEXT_PROBE.unavailableError;
}