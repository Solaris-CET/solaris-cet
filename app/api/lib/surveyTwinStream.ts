import { resolveSurveyEngineUrl, SURVEY_HEALTH_PROBE } from './surveyHealth';
import { parseSurveyTwinReportId, SURVEY_TWIN_UNREACHABLE_ERROR, surveyTwinDetailErrorMessage } from './surveyTwinShared';

export const SURVEY_TWIN_STREAM_PATH = '/api/survey/twin-stream';
export const SURVEY_TWIN_STREAM_METHODS = 'GET, OPTIONS';

export const SURVEY_TWIN_STREAM_PROBE = {
  path: SURVEY_TWIN_STREAM_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  reportIdParam: 'report_id' as const,
  persistentParam: 'persistent' as const,
  missingReportIdError: 'report_id required' as const,
  unavailableError: 'Twin stream unavailable' as const,
  unreachableError: SURVEY_TWIN_UNREACHABLE_ERROR,
  fetchTimeoutMs: 30_000,
  sseContentType: 'text/event-stream' as const,
  sseCacheControl: 'no-cache' as const,
  notFoundStatus: 404,
  unreachableStatus: 503,
  engineErrorStatus: 502,
  persistentTruthy: ['1', 'true', 'yes'] as const,
};

export function parseSurveyTwinStreamReportId(raw: string | null | undefined): string | null {
  return parseSurveyTwinReportId(raw, true);
}

export function parseSurveyTwinStreamPersistent(raw: string | null | undefined): boolean {
  const normalized = (raw ?? '').trim().toLowerCase();
  return SURVEY_TWIN_STREAM_PROBE.persistentTruthy.includes(normalized as (typeof SURVEY_TWIN_STREAM_PROBE.persistentTruthy)[number]);
}

export function resolveSurveyTwinStreamEngineUrl(env: NodeJS.ProcessEnv = process.env): string {
  return resolveSurveyEngineUrl(env);
}

export function buildSurveyTwinStreamEngineUrl(engineUrl: string, reportId: string, persistent: boolean): string {
  const base = `${engineUrl.replace(/\/$/, '')}/twin-stream/${encodeURIComponent(reportId)}`;
  return persistent ? `${base}?persistent=true` : base;
}

export function buildSurveyTwinStreamFetchOptions(persistent: boolean): RequestInit {
  return persistent ? {} : { signal: AbortSignal.timeout(SURVEY_TWIN_STREAM_PROBE.fetchTimeoutMs) };
}

export function buildSurveyTwinStreamResponseHeaders(allowedOrigin: string): Record<string, string> {
  return {
    'Content-Type': SURVEY_TWIN_STREAM_PROBE.sseContentType,
    'Cache-Control': SURVEY_TWIN_STREAM_PROBE.sseCacheControl,
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': allowedOrigin,
    Vary: 'Origin',
  };
}

export function surveyTwinStreamHttpStatus(engineStatus: number): number {
  return engineStatus === SURVEY_TWIN_STREAM_PROBE.notFoundStatus
    ? SURVEY_TWIN_STREAM_PROBE.notFoundStatus
    : SURVEY_TWIN_STREAM_PROBE.engineErrorStatus;
}

export function surveyTwinStreamErrorMessage(data: unknown): string {
  return surveyTwinDetailErrorMessage(data, SURVEY_TWIN_STREAM_PROBE.unavailableError);
}

export function buildSurveyTwinStreamErrorPayload(error: string) {
  return { error, platform: SURVEY_HEALTH_PROBE.platform };
}