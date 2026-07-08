import { resolveSurveyEngineUrl, SURVEY_HEALTH_PROBE } from './surveyHealth';
import {
  buildSurveyTwinListQuery,
  parseSurveyTwinLimit,
  parseSurveyTwinReportId,
  SURVEY_TWIN_LIMIT_PARAM,
  SURVEY_TWIN_REPORT_ID_PARAM,
  SURVEY_TWIN_UNREACHABLE_ERROR,
  surveyTwinDetailErrorMessage,
} from './surveyTwinShared';

export const SURVEY_TWIN_EVENTS_PATH = '/api/survey/twin-events';
export const SURVEY_TWIN_EVENTS_METHODS = 'GET, OPTIONS';

export const SURVEY_TWIN_EVENTS_PROBE = {
  path: SURVEY_TWIN_EVENTS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  cacheControl: 'no-store' as const,
  reportIdParam: SURVEY_TWIN_REPORT_ID_PARAM,
  limitParam: SURVEY_TWIN_LIMIT_PARAM,
  unavailableError: 'Twin events unavailable' as const,
  unreachableError: SURVEY_TWIN_UNREACHABLE_ERROR,
  fetchTimeoutMs: 8000,
  unreachableStatus: 503,
  engineErrorStatus: 502,
};

export function parseSurveyTwinEventsReportId(raw: string | null | undefined): string {
  return parseSurveyTwinReportId(raw, false) ?? '';
}

export function resolveSurveyTwinEventsEngineUrl(env: NodeJS.ProcessEnv = process.env): string {
  return resolveSurveyEngineUrl(env);
}

export function buildSurveyTwinEventsEngineUrl(engineUrl: string, limit: number, reportId?: string): string {
  const qs = buildSurveyTwinListQuery(limit, reportId || undefined);
  return `${engineUrl.replace(/\/$/, '')}/twin-events?${qs}`;
}

export function buildSurveyTwinEventsSuccessPayload(data: Record<string, unknown>) {
  return {
    platform: SURVEY_HEALTH_PROBE.platform,
    ...data,
  };
}

export function surveyTwinEventsErrorMessage(data: unknown): string {
  return surveyTwinDetailErrorMessage(data, SURVEY_TWIN_EVENTS_PROBE.unavailableError);
}

export { parseSurveyTwinLimit };