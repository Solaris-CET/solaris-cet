export const SURVEY_HEALTH_PATH = '/api/survey/health';
export const SURVEY_HEALTH_METHODS = 'GET, OPTIONS';

export const SURVEY_HEALTH_PROBE = {
  path: SURVEY_HEALTH_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  cacheControl: 'no-store' as const,
  platform: 'solaris-cet' as const,
  defaultEngineUrl: 'http://127.0.0.1:8000' as const,
  fetchTimeoutMs: 5000,
  unreachableError: 'survey-engine unreachable' as const,
  unreachableStatus: 503,
  engineErrorStatus: 502,
};

export function resolveSurveyEngineUrl(env: NodeJS.ProcessEnv = process.env): string {
  const configured = String(env.SURVEY_ENGINE_URL ?? '').trim();
  return configured || SURVEY_HEALTH_PROBE.defaultEngineUrl;
}

export function buildSurveyEngineHealthUrl(engineUrl: string): string {
  return `${engineUrl.replace(/\/$/, '')}/health`;
}

export type SurveyHealthPayload = {
  platform: typeof SURVEY_HEALTH_PROBE.platform;
  engine: unknown;
  engine_url: string;
};

export function buildSurveyHealthSuccessPayload(engine: unknown, engineUrl: string): SurveyHealthPayload {
  return {
    platform: SURVEY_HEALTH_PROBE.platform,
    engine,
    engine_url: engineUrl,
  };
}

export function buildSurveyHealthUnreachablePayload(engineUrl: string): SurveyHealthPayload {
  return {
    platform: SURVEY_HEALTH_PROBE.platform,
    engine: { ok: false, error: SURVEY_HEALTH_PROBE.unreachableError },
    engine_url: engineUrl,
  };
}

export function surveyHealthHttpStatus(engineResponseOk: boolean): number {
  return engineResponseOk ? 200 : SURVEY_HEALTH_PROBE.engineErrorStatus;
}

export type SurveyEngineHealthProbe =
  | { ok: true; data: unknown; engineResponseOk: boolean }
  | { ok: false; unreachable: true };

export async function probeSurveyEngineHealth(
  engineUrl: string,
  fetchFn: typeof fetch = fetch,
): Promise<SurveyEngineHealthProbe> {
  try {
    const res = await fetchFn(buildSurveyEngineHealthUrl(engineUrl), {
      signal: AbortSignal.timeout(SURVEY_HEALTH_PROBE.fetchTimeoutMs),
    });
    const data = await res.json();
    return { ok: true, data, engineResponseOk: res.ok };
  } catch {
    return { ok: false, unreachable: true };
  }
}