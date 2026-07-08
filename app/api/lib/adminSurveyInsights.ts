import { z } from 'zod';

import type { AdminRouteGuardProbe } from './adminAuth';
import { logApiRouteEvent } from './apiObservability';

export const ADMIN_SURVEY_INSIGHTS_PATH = '/api/admin/survey-insights';
export const ADMIN_SURVEY_INSIGHTS_METHODS = 'GET, OPTIONS';

export const ADMIN_SURVEY_INSIGHTS_PROBE = {
  path: ADMIN_SURVEY_INSIGHTS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  minRole: 'viewer' as const,
  unauthenticatedStatus: 401,
  unauthorizedError: 'Unauthorized' as const,
  forbiddenStatus: 403,
  forbiddenError: 'Forbidden' as const,
  methodNotAllowedError: 'Method not allowed' as const,
  fetchTimeoutMs: 8000,
  missingReportIdError: 'report_id required' as const,
  reportNotFoundError: 'Report not found' as const,
  rateLimitKey: 'admin-survey-insights' as const,
  rateLimit: 30,
  rateWindowSeconds: 60,
  observabilityLabel: 'admin.survey_insights' as const,
  maxReportIdLength: 80,
};

export const ADMIN_SURVEY_INSIGHTS_AUTH_GUARD: AdminRouteGuardProbe = {
  minRole: ADMIN_SURVEY_INSIGHTS_PROBE.minRole,
  unauthenticatedStatus: ADMIN_SURVEY_INSIGHTS_PROBE.unauthenticatedStatus,
  unauthorizedError: ADMIN_SURVEY_INSIGHTS_PROBE.unauthorizedError,
  forbiddenStatus: ADMIN_SURVEY_INSIGHTS_PROBE.forbiddenStatus,
  forbiddenError: ADMIN_SURVEY_INSIGHTS_PROBE.forbiddenError,
};

export const ADMIN_SURVEY_INSIGHTS_OPENAPI = {
  path: ADMIN_SURVEY_INSIGHTS_PATH,
  method: 'get' as const,
  tag: 'admin-survey' as const,
  summary: 'Admin survey insights aggregate (context + twin + corrections)',
  reportIdParam: 'report_id' as const,
};

export const adminSurveyInsightsQuerySchema = z.object({
  report_id: z.string().trim().min(1).max(ADMIN_SURVEY_INSIGHTS_PROBE.maxReportIdLength),
});

export type AdminSurveyInsightsQuery = z.infer<typeof adminSurveyInsightsQuerySchema>;

export type AdminSurveyInsightsQueryResult =
  | { ok: true; reportId: string }
  | { ok: false; error: string };

export function parseAdminSurveyInsightsQuery(searchParams: URLSearchParams): AdminSurveyInsightsQueryResult {
  const parsed = adminSurveyInsightsQuerySchema.safeParse({
    report_id: searchParams.get('report_id') ?? '',
  });
  if (!parsed.success) return { ok: false, error: ADMIN_SURVEY_INSIGHTS_PROBE.missingReportIdError };
  return { ok: true, reportId: parsed.data.report_id };
}

export function buildAdminSurveyInsightsError(error: string): { error: string } {
  return { error };
}

export function logAdminSurveyInsightsEvent(
  event: 'request' | 'success' | 'error',
  meta: Record<string, unknown> = {},
): void {
  logApiRouteEvent(ADMIN_SURVEY_INSIGHTS_PROBE.observabilityLabel, event, meta);
}

export function surveyInsightsEngineBaseUrl(): string {
  return (process.env.SURVEY_ENGINE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
}

export function parseSurveyInsightsReportId(searchParams: URLSearchParams): string {
  const parsed = parseAdminSurveyInsightsQuery(searchParams);
  return parsed.ok ? parsed.reportId : '';
}

export function surveyInsightsContextUrl(reportId: string): string {
  return `${surveyInsightsEngineBaseUrl()}/context/${encodeURIComponent(reportId)}`;
}

export function surveyInsightsTwinFeedUrl(reportId: string): string {
  return `${surveyInsightsEngineBaseUrl()}/twin-feed/${encodeURIComponent(reportId)}`;
}

export function surveyInsightsCorrectionsUrl(reportId: string): string {
  return `${surveyInsightsEngineBaseUrl()}/corrections?report_id=${encodeURIComponent(reportId)}`;
}

export function buildSurveyInsightFlags(context: {
  explainable?: { low_confidence_count?: number };
  files?: { permit_pack_url?: string };
  crm?: { context_url?: string };
}, twin: { low_confidence_count?: number } | null): {
  low_confidence: boolean;
  low_confidence_count: number;
  permit_pack_url?: string;
  context_url?: string;
} {
  const lowConfidence = (context.explainable?.low_confidence_count ?? twin?.low_confidence_count ?? 0) as number;
  return {
    low_confidence: lowConfidence > 0,
    low_confidence_count: lowConfidence,
    permit_pack_url: context.files?.permit_pack_url,
    context_url: context.crm?.context_url,
  };
}