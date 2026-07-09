import { resolveSurveyEngineUrl, SURVEY_HEALTH_PROBE } from './surveyHealth';
import { SURVEY_TWIN_UNREACHABLE_ERROR, surveyTwinDetailErrorMessage } from './surveyTwinShared';

export const SURVEY_ROUTER_STATS_PATH = '/api/survey/router/stats';
export const SURVEY_ROUTER_STATS_METHODS = 'GET, OPTIONS';

export const SURVEY_ROUTER_STATS_PROBE = {
  path: SURVEY_ROUTER_STATS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  cacheControl: 'no-store' as const,
  unavailableError: 'Router stats unavailable' as const,
  unreachableError: SURVEY_TWIN_UNREACHABLE_ERROR,
  fetchTimeoutMs: 8000,
  unreachableStatus: 503,
  engineErrorStatus: 502,
};

export function resolveSurveyRouterStatsEngineUrl(env: NodeJS.ProcessEnv = process.env): string {
  return resolveSurveyEngineUrl(env);
}

export function buildSurveyRouterStatsEngineUrl(engineUrl: string): string {
  return `${engineUrl.replace(/\/$/, '')}/router/stats`;
}

export function buildSurveyRouterStatsSuccessPayload(data: Record<string, unknown>) {
  return {
    platform: SURVEY_HEALTH_PROBE.platform,
    ...data,
  };
}

export function surveyRouterStatsErrorMessage(data: unknown): string {
  return surveyTwinDetailErrorMessage(data, SURVEY_ROUTER_STATS_PROBE.unavailableError);
}