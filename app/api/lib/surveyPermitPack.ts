import { parseSurveyContextReportId } from './surveyContext';
import { resolveSurveyEngineUrl, SURVEY_HEALTH_PROBE } from './surveyHealth';

export const SURVEY_PERMIT_PACK_PATH = '/api/survey/permit-pack';
export const SURVEY_PERMIT_PACK_METHODS = 'GET, OPTIONS';

export const SURVEY_PERMIT_PACK_PROBE = {
  path: SURVEY_PERMIT_PACK_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  reportIdParam: 'report_id' as const,
  missingReportIdError: 'report_id required' as const,
  unavailableError: 'Permit pack unavailable' as const,
  unreachableError: 'survey-engine unreachable' as const,
  zipMediaType: 'application/zip' as const,
  cacheControl: 'private, max-age=3600' as const,
  fetchTimeoutMs: 30_000,
  notFoundStatus: 404,
  unreachableStatus: 503,
  engineErrorStatus: 502,
};

export function parseSurveyPermitPackReportId(raw: string | null | undefined): string | null {
  return parseSurveyContextReportId(raw);
}

export function resolveSurveyPermitPackEngineUrl(env: NodeJS.ProcessEnv = process.env): string {
  return resolveSurveyEngineUrl(env);
}

export function buildSurveyPermitPackEngineUrl(engineUrl: string, reportId: string): string {
  return `${engineUrl.replace(/\/$/, '')}/permit-pack/${encodeURIComponent(reportId)}`;
}

export function buildSurveyPermitPackFilename(reportId: string): string {
  return `PERMIT_${reportId}.zip`;
}

export function buildSurveyPermitPackUnreachablePayload() {
  return { error: SURVEY_PERMIT_PACK_PROBE.unreachableError, platform: SURVEY_HEALTH_PROBE.platform };
}

export function surveyPermitPackHttpStatus(engineStatus: number): number {
  return engineStatus === SURVEY_PERMIT_PACK_PROBE.notFoundStatus
    ? SURVEY_PERMIT_PACK_PROBE.notFoundStatus
    : SURVEY_PERMIT_PACK_PROBE.engineErrorStatus;
}

export function surveyPermitPackErrorMessage(raw: string): string {
  return raw.trim() || SURVEY_PERMIT_PACK_PROBE.unavailableError;
}