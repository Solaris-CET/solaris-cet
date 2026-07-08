import { resolveSurveyEngineUrl, SURVEY_HEALTH_PROBE } from './surveyHealth';

export const SURVEY_BATCH_PATH = '/api/survey/batch';
export const SURVEY_BATCH_METHODS = 'POST, OPTIONS';

export const SURVEY_BATCH_PROBE = {
  path: SURVEY_BATCH_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  cacheControl: 'no-store' as const,
  installerKeyHeader: 'X-Installer-Key' as const,
  allowHeaders: 'Content-Type, X-Installer-Key' as const,
  expectedContentType: 'multipart/form-data' as const,
  invalidContentTypeError: 'Expected multipart/form-data' as const,
  invalidEngineResponseError: 'Invalid engine response' as const,
  engineBatchErrorFallback: 'Engine batch error' as const,
  unreachableError: 'survey-engine unreachable' as const,
  fetchTimeoutMs: 600_000,
  filesPath: '/api/survey/files' as const,
};

export type SurveyBatchResult = {
  job_id: string;
  success: boolean;
  report_id: string;
  pdf_filename: string;
  ahj_filename: string;
  score: number;
  error: string;
};

export type SurveyBatchEnginePayload = {
  total: number;
  succeeded: number;
  failed: number;
  results: SurveyBatchResult[];
};

export function resolveSurveyBatchEngineUrl(env: NodeJS.ProcessEnv = process.env): string {
  return resolveSurveyEngineUrl(env);
}

export function buildSurveyBatchEngineUrl(engineUrl: string): string {
  return `${engineUrl.replace(/\/$/, '')}/batch`;
}

export function isSurveyBatchMultipartContentType(contentType: string): boolean {
  return contentType.toLowerCase().includes(SURVEY_BATCH_PROBE.expectedContentType);
}

export function buildSurveyBatchFileUrl(filename: string): string {
  return `${SURVEY_BATCH_PROBE.filesPath}?file=${encodeURIComponent(filename)}`;
}

export function mapSurveyBatchResults(results: SurveyBatchResult[]) {
  return results.map((result) => ({
    ...result,
    pdf_url: result.pdf_filename ? buildSurveyBatchFileUrl(result.pdf_filename) : '',
    ahj_url: result.ahj_filename ? buildSurveyBatchFileUrl(result.ahj_filename) : '',
  }));
}

export function buildSurveyBatchSuccessPayload(payload: SurveyBatchEnginePayload) {
  return {
    ...payload,
    results: mapSurveyBatchResults(payload.results),
  };
}

export function buildSurveyBatchUnreachablePayload(engineUrl: string) {
  return {
    error: SURVEY_BATCH_PROBE.unreachableError,
    engine_url: engineUrl,
    platform: SURVEY_HEALTH_PROBE.platform,
  };
}