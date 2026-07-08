import { resolveSurveyEngineUrl, SURVEY_HEALTH_PROBE } from './surveyHealth';
import {
  parseSurveyTwinReportId,
  SURVEY_TWIN_MISSING_REPORT_ID_ERROR,
  SURVEY_TWIN_REPORT_ID_PARAM,
  SURVEY_TWIN_UNREACHABLE_ERROR,
  surveyTwinDetailErrorMessage,
} from './surveyTwinShared';

export const SURVEY_TWIN_FEED_PATH = '/api/survey/twin-feed';
export const SURVEY_TWIN_FEED_METHODS = 'GET, OPTIONS';

export const SURVEY_TWIN_FEED_PROBE = {
  path: SURVEY_TWIN_FEED_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  cacheControl: 'private, max-age=120' as const,
  reportIdParam: SURVEY_TWIN_REPORT_ID_PARAM,
  missingReportIdError: SURVEY_TWIN_MISSING_REPORT_ID_ERROR,
  unavailableError: 'Twin feed unavailable' as const,
  unreachableError: SURVEY_TWIN_UNREACHABLE_ERROR,
  fetchTimeoutMs: 8000,
  notFoundStatus: 404,
  unreachableStatus: 503,
  engineErrorStatus: 502,
};

export function parseSurveyTwinFeedReportId(raw: string | null | undefined): string | null {
  return parseSurveyTwinReportId(raw, true);
}

export function resolveSurveyTwinFeedEngineUrl(env: NodeJS.ProcessEnv = process.env): string {
  return resolveSurveyEngineUrl(env);
}

export function buildSurveyTwinFeedEngineUrl(engineUrl: string, reportId: string): string {
  return `${engineUrl.replace(/\/$/, '')}/twin-feed/${encodeURIComponent(reportId)}`;
}

export function buildSurveyTwinFeedSuccessPayload(feed: unknown) {
  return {
    platform: SURVEY_HEALTH_PROBE.platform,
    feed,
  };
}

export function surveyTwinFeedHttpStatus(engineStatus: number): number {
  return engineStatus === SURVEY_TWIN_FEED_PROBE.notFoundStatus
    ? SURVEY_TWIN_FEED_PROBE.notFoundStatus
    : SURVEY_TWIN_FEED_PROBE.engineErrorStatus;
}

export function surveyTwinFeedErrorMessage(data: unknown): string {
  return surveyTwinDetailErrorMessage(data, SURVEY_TWIN_FEED_PROBE.unavailableError);
}

export type SurveyTwinFeedProbeResult =
  | { ok: true; data: unknown; status: number }
  | { ok: false; unreachable: true };

export async function probeSurveyTwinFeed(
  engineUrl: string,
  reportId: string,
  fetchFn: typeof fetch = fetch,
): Promise<SurveyTwinFeedProbeResult> {
  try {
    const res = await fetchFn(buildSurveyTwinFeedEngineUrl(engineUrl, reportId), {
      signal: AbortSignal.timeout(SURVEY_TWIN_FEED_PROBE.fetchTimeoutMs),
    });
    const data = await res.json();
    return { ok: true, data, status: res.status };
  } catch {
    return { ok: false, unreachable: true };
  }
}