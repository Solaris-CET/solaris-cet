import { resolveSurveyEngineUrl, SURVEY_HEALTH_PROBE } from './surveyHealth';

export const SURVEY_CORRECTIONS_PATH = '/api/survey/corrections';
export const SURVEY_CORRECTIONS_METHODS = 'GET, POST, OPTIONS';

export const SURVEY_CORRECTIONS_PROBE = {
  path: SURVEY_CORRECTIONS_PATH,
  methods: ['GET', 'POST', 'OPTIONS'] as const,
  authRequired: false,
  cacheControl: 'no-store' as const,
  installerKeyHeader: 'X-Installer-Key' as const,
  allowHeaders: 'Content-Type, X-Installer-Key' as const,
  reportIdParam: 'report_id' as const,
  invalidJsonError: 'JSON invalid' as const,
  requiredFieldsError: 'Câmpuri obligatorii: report_id, field, corrected' as const,
  unavailableError: 'Corrections unavailable' as const,
  correctionFailedFallback: 'Correction failed' as const,
  unreachableError: 'survey-engine unreachable' as const,
  fetchTimeoutMs: 8000,
  unreachableStatus: 503,
  engineErrorStatus: 502,
  twinFeedEvent: 'twin_feed_updated' as const,
  correctionLoggedEvent: 'correction_logged' as const,
};

export type SurveyCorrectionPayload = {
  report_id?: string;
  field?: string;
  original?: string;
  corrected?: string;
  technician?: string;
  notes?: string;
};

export type ParsedSurveyCorrection = {
  reportId: string;
  field: string;
  original: string;
  corrected: string;
  technician: string;
  notes: string;
};

export function resolveSurveyCorrectionsEngineUrl(env: NodeJS.ProcessEnv = process.env): string {
  return resolveSurveyEngineUrl(env);
}

export function buildSurveyCorrectionsListUrl(engineUrl: string, reportId?: string): string {
  const base = `${engineUrl.replace(/\/$/, '')}/corrections`;
  const trimmed = (reportId ?? '').trim();
  return trimmed ? `${base}?report_id=${encodeURIComponent(trimmed)}` : base;
}

export function buildSurveyCorrectionsPostUrl(engineUrl: string): string {
  return `${engineUrl.replace(/\/$/, '')}/corrections`;
}

export function parseSurveyCorrectionPayload(body: unknown): ParsedSurveyCorrection | null {
  if (!body || typeof body !== 'object') return null;
  const rec = body as SurveyCorrectionPayload;
  const reportId = typeof rec.report_id === 'string' ? rec.report_id.trim() : '';
  const field = typeof rec.field === 'string' ? rec.field.trim() : '';
  const corrected = typeof rec.corrected === 'string' ? rec.corrected.trim() : '';
  if (!reportId || !field || !corrected) return null;
  return {
    reportId,
    field,
    corrected,
    original: typeof rec.original === 'string' ? rec.original : '',
    technician: typeof rec.technician === 'string' ? rec.technician : '',
    notes: typeof rec.notes === 'string' ? rec.notes : '',
  };
}

export function buildSurveyCorrectionEngineBody(correction: ParsedSurveyCorrection) {
  return {
    report_id: correction.reportId,
    field: correction.field,
    original: correction.original,
    corrected: correction.corrected,
    technician: correction.technician,
    notes: correction.notes,
  };
}

export function buildSurveyCorrectionsPlatformPayload(data: Record<string, unknown>) {
  return {
    platform: SURVEY_HEALTH_PROBE.platform,
    ...data,
  };
}

export function surveyCorrectionErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object' && 'detail' in data && typeof (data as { detail?: unknown }).detail === 'string') {
    return (data as { detail: string }).detail;
  }
  return fallback;
}

export function buildSurveyCorrectionWebhookPayload(correction: ParsedSurveyCorrection) {
  return {
    report_id: correction.reportId,
    field: correction.field,
    corrected: correction.corrected,
  };
}