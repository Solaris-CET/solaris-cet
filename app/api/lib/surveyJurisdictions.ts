import { resolveSurveyEngineUrl, SURVEY_HEALTH_PROBE } from './surveyHealth';

export const SURVEY_JURISDICTIONS_PATH = '/api/survey/jurisdictions';
export const SURVEY_JURISDICTIONS_METHODS = 'GET, OPTIONS';

export const SURVEY_JURISDICTIONS_PROBE = {
  path: SURVEY_JURISDICTIONS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  cacheControl: 'public, max-age=86400' as const,
  unreachableError: 'survey-engine unreachable' as const,
  fetchTimeoutMs: 8000,
  unreachableStatus: 503,
  engineErrorStatus: 502,
};

export function resolveSurveyJurisdictionsEngineUrl(env: NodeJS.ProcessEnv = process.env): string {
  return resolveSurveyEngineUrl(env);
}

export function buildSurveyJurisdictionsEngineUrl(engineUrl: string): string {
  return `${engineUrl.replace(/\/$/, '')}/jurisdictions`;
}

export function buildSurveyJurisdictionsUnreachablePayload() {
  return { error: SURVEY_JURISDICTIONS_PROBE.unreachableError, platform: SURVEY_HEALTH_PROBE.platform };
}

export function surveyJurisdictionsHttpStatus(engineResponseOk: boolean): number {
  return engineResponseOk ? 200 : SURVEY_JURISDICTIONS_PROBE.engineErrorStatus;
}

export type SurveyJurisdictionsProbeResult =
  | { ok: true; data: unknown; engineResponseOk: boolean }
  | { ok: false; unreachable: true };

export async function probeSurveyJurisdictions(
  engineUrl: string,
  fetchFn: typeof fetch = fetch,
): Promise<SurveyJurisdictionsProbeResult> {
  try {
    const res = await fetchFn(buildSurveyJurisdictionsEngineUrl(engineUrl), {
      signal: AbortSignal.timeout(SURVEY_JURISDICTIONS_PROBE.fetchTimeoutMs),
    });
    const data = await res.json();
    return { ok: true, data, engineResponseOk: res.ok };
  } catch {
    return { ok: false, unreachable: true };
  }
}