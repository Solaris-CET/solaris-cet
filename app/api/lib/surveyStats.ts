import { resolveSurveyEngineUrl, SURVEY_HEALTH_PROBE } from './surveyHealth';

export const SURVEY_STATS_PATH = '/api/survey/stats';
export const SURVEY_STATS_METHODS = 'GET, OPTIONS';

export const SURVEY_STATS_PROBE = {
  path: SURVEY_STATS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  cacheControl: 'public, max-age=300' as const,
  unavailableError: 'Engine stats unavailable' as const,
  unreachableError: 'survey-engine unreachable' as const,
  fetchTimeoutMs: 8000,
  unreachableStatus: 503,
  engineErrorStatus: 502,
};

export function resolveSurveyStatsEngineUrl(env: NodeJS.ProcessEnv = process.env): string {
  return resolveSurveyEngineUrl(env);
}

export function buildSurveyStatsEngineUrl(engineUrl: string): string {
  return `${engineUrl.replace(/\/$/, '')}/stats`;
}

export function buildSurveyStatsSuccessPayload(stats: unknown) {
  return {
    platform: SURVEY_HEALTH_PROBE.platform,
    stats,
  };
}

export function buildSurveyStatsUnreachablePayload() {
  return { error: SURVEY_STATS_PROBE.unreachableError, platform: SURVEY_HEALTH_PROBE.platform };
}

export type SurveyStatsProbeResult =
  | { ok: true; data: unknown; engineResponseOk: boolean }
  | { ok: false; unreachable: true };

export async function probeSurveyStats(
  engineUrl: string,
  fetchFn: typeof fetch = fetch,
): Promise<SurveyStatsProbeResult> {
  try {
    const res = await fetchFn(buildSurveyStatsEngineUrl(engineUrl), {
      signal: AbortSignal.timeout(SURVEY_STATS_PROBE.fetchTimeoutMs),
    });
    const data = await res.json();
    return { ok: true, data, engineResponseOk: res.ok };
  } catch {
    return { ok: false, unreachable: true };
  }
}