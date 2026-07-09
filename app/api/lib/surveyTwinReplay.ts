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

export const SURVEY_TWIN_REPLAY_PATH = '/api/survey/twin-replay';
export const SURVEY_TWIN_REPLAY_METHODS = 'GET, OPTIONS';
export const SURVEY_TWIN_FROM_SEQ_PARAM = 'from_seq' as const;

export const SURVEY_TWIN_REPLAY_PROBE = {
  path: SURVEY_TWIN_REPLAY_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  cacheControl: 'no-store' as const,
  reportIdParam: SURVEY_TWIN_REPORT_ID_PARAM,
  limitParam: SURVEY_TWIN_LIMIT_PARAM,
  fromSeqParam: SURVEY_TWIN_FROM_SEQ_PARAM,
  unavailableError: 'Twin replay unavailable' as const,
  unreachableError: SURVEY_TWIN_UNREACHABLE_ERROR,
  fetchTimeoutMs: 8000,
  unreachableStatus: 503,
  engineErrorStatus: 502,
};

export function parseSurveyTwinReplayFromSeq(raw: string | null | undefined): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
}

export function parseSurveyTwinReplayReportId(raw: string | null | undefined): string {
  return parseSurveyTwinReportId(raw, false) ?? '';
}

export function resolveSurveyTwinReplayEngineUrl(env: NodeJS.ProcessEnv = process.env): string {
  return resolveSurveyEngineUrl(env);
}

export function buildSurveyTwinReplayEngineUrl(
  engineUrl: string,
  fromSeq: number,
  limit: number,
  reportId?: string,
): string {
  const qs = buildSurveyTwinListQuery(limit, reportId || undefined);
  qs.set(SURVEY_TWIN_FROM_SEQ_PARAM, String(fromSeq));
  return `${engineUrl.replace(/\/$/, '')}/twin-replay?${qs}`;
}

export function buildSurveyTwinReplaySuccessPayload(data: Record<string, unknown>) {
  return {
    platform: SURVEY_HEALTH_PROBE.platform,
    ...data,
  };
}

export function surveyTwinReplayErrorMessage(data: unknown): string {
  return surveyTwinDetailErrorMessage(data, SURVEY_TWIN_REPLAY_PROBE.unavailableError);
}

export { parseSurveyTwinLimit };