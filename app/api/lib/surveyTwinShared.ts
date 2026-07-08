export const SURVEY_TWIN_REPORT_ID_PARAM = 'report_id' as const;
export const SURVEY_TWIN_LIMIT_PARAM = 'limit' as const;
export const SURVEY_TWIN_DEFAULT_LIMIT = 50;
export const SURVEY_TWIN_MAX_LIMIT = 200;
export const SURVEY_TWIN_MIN_LIMIT = 1;
export const SURVEY_TWIN_MAX_REPORT_ID_LENGTH = 80;
export const SURVEY_TWIN_MISSING_REPORT_ID_ERROR = 'report_id required' as const;
export const SURVEY_TWIN_UNREACHABLE_ERROR = 'survey-engine unreachable' as const;

export function parseSurveyTwinReportId(raw: string | null | undefined, required = true): string | null {
  const reportId = (raw ?? '').trim();
  if (!reportId) return required ? null : '';
  if (reportId.length > SURVEY_TWIN_MAX_REPORT_ID_LENGTH) return null;
  return reportId;
}

export function parseSurveyTwinLimit(raw: string | null | undefined): number {
  const parsed = Number(raw);
  const limit = Number.isFinite(parsed) && parsed > 0 ? parsed : SURVEY_TWIN_DEFAULT_LIMIT;
  return Math.min(SURVEY_TWIN_MAX_LIMIT, Math.max(SURVEY_TWIN_MIN_LIMIT, limit));
}

export function buildSurveyTwinListQuery(limit: number, reportId?: string): URLSearchParams {
  const qs = new URLSearchParams({ limit: String(limit) });
  if (reportId) qs.set(SURVEY_TWIN_REPORT_ID_PARAM, reportId);
  return qs;
}

export function surveyTwinDetailErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object' && 'detail' in data && typeof (data as { detail?: unknown }).detail === 'string') {
    return (data as { detail: string }).detail;
  }
  return fallback;
}