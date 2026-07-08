import { resolveSurveyEngineUrl, SURVEY_HEALTH_PROBE } from './surveyHealth';

export const SURVEY_DASHBOARD_PATH = '/api/survey/dashboard';
export const SURVEY_DASHBOARD_METHODS = 'GET, OPTIONS';

export const SURVEY_DASHBOARD_PROBE = {
  path: SURVEY_DASHBOARD_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  cacheControl: 'no-store' as const,
  unreachableError: 'survey-engine unreachable' as const,
  fetchTimeoutMs: 8000,
  unreachableStatus: 503,
  engineErrorStatus: 502,
};

export function resolveSurveyDashboardEngineUrl(env: NodeJS.ProcessEnv = process.env): string {
  return resolveSurveyEngineUrl(env);
}

export function buildSurveyDashboardEngineUrl(engineUrl: string): string {
  return `${engineUrl.replace(/\/$/, '')}/dashboard`;
}

export function buildSurveyDashboardUnreachablePayload(engineUrl: string) {
  return {
    error: SURVEY_DASHBOARD_PROBE.unreachableError,
    engine_url: engineUrl,
    platform: SURVEY_HEALTH_PROBE.platform,
  };
}

export function surveyDashboardHttpStatus(engineResponseOk: boolean): number {
  return engineResponseOk ? 200 : SURVEY_DASHBOARD_PROBE.engineErrorStatus;
}

export type SurveyDashboardProbeResult =
  | { ok: true; data: unknown; engineResponseOk: boolean }
  | { ok: false; unreachable: true };

export async function probeSurveyDashboard(
  engineUrl: string,
  fetchFn: typeof fetch = fetch,
): Promise<SurveyDashboardProbeResult> {
  try {
    const res = await fetchFn(buildSurveyDashboardEngineUrl(engineUrl), {
      signal: AbortSignal.timeout(SURVEY_DASHBOARD_PROBE.fetchTimeoutMs),
    });
    const data = await res.json();
    return { ok: true, data, engineResponseOk: res.ok };
  } catch {
    return { ok: false, unreachable: true };
  }
}