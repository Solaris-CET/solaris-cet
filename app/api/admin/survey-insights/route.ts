import { guardAdminRoute } from '@/api/lib/adminAuth';
import {
  ADMIN_SURVEY_INSIGHTS_AUTH_GUARD,
  ADMIN_SURVEY_INSIGHTS_PROBE,
  buildAdminSurveyInsightsError,
  buildSurveyInsightFlags,
  logAdminSurveyInsightsEvent,
  parseAdminSurveyInsightsQuery,
  surveyInsightsContextUrl,
  surveyInsightsCorrectionsUrl,
  surveyInsightsTwinFeedUrl,
} from '../../lib/adminSurveyInsights';
import { getAllowedOrigin } from '@/api/lib/cors';
import { corsJson, corsOptions } from '@/api/lib/http';
import { withRateLimit } from '@/api/lib/rateLimit';

export {
  ADMIN_SURVEY_INSIGHTS_AUTH_GUARD,
  ADMIN_SURVEY_INSIGHTS_OPENAPI,
  ADMIN_SURVEY_INSIGHTS_PATH,
  ADMIN_SURVEY_INSIGHTS_PROBE,
} from '../../lib/adminSurveyInsights';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (origin && allowedOrigin !== origin) {
    return corsJson(req, ADMIN_SURVEY_INSIGHTS_PROBE.forbiddenStatus, buildAdminSurveyInsightsError(ADMIN_SURVEY_INSIGHTS_PROBE.forbiddenError));
  }
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') {
    return corsJson(req, 405, buildAdminSurveyInsightsError(ADMIN_SURVEY_INSIGHTS_PROBE.methodNotAllowedError));
  }

  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: ADMIN_SURVEY_INSIGHTS_PROBE.rateLimitKey,
    limit: ADMIN_SURVEY_INSIGHTS_PROBE.rateLimit,
    windowSeconds: ADMIN_SURVEY_INSIGHTS_PROBE.rateWindowSeconds,
  });
  if (limited) return limited;

  const ctx = await guardAdminRoute(req, ADMIN_SURVEY_INSIGHTS_AUTH_GUARD);
  if ('error' in ctx) {
    logAdminSurveyInsightsEvent('error', { status: ctx.status, reason: 'auth' });
    return corsJson(req, ctx.status, buildAdminSurveyInsightsError(ctx.error));
  }

  const query = parseAdminSurveyInsightsQuery(new URL(req.url).searchParams);
  if (!query.ok) {
    logAdminSurveyInsightsEvent('error', { status: 400, reason: 'validation' });
    return corsJson(req, 400, buildAdminSurveyInsightsError(query.error));
  }

  logAdminSurveyInsightsEvent('request', { reportId: query.reportId, adminId: ctx.admin.id });

  const timeout = ADMIN_SURVEY_INSIGHTS_PROBE.fetchTimeoutMs;
  const [contextRes, twinRes, corrRes] = await Promise.all([
    fetch(surveyInsightsContextUrl(query.reportId), { signal: AbortSignal.timeout(timeout) }),
    fetch(surveyInsightsTwinFeedUrl(query.reportId), { signal: AbortSignal.timeout(timeout) }),
    fetch(surveyInsightsCorrectionsUrl(query.reportId), { signal: AbortSignal.timeout(timeout) }),
  ]);

  if (!contextRes.ok) {
    const status = contextRes.status === 404 ? 404 : 502;
    logAdminSurveyInsightsEvent('error', { status, reportId: query.reportId, reason: 'engine' });
    return corsJson(req, status, buildAdminSurveyInsightsError(ADMIN_SURVEY_INSIGHTS_PROBE.reportNotFoundError));
  }

  const context = await contextRes.json();
  const twin = twinRes.ok ? await twinRes.json() : null;
  const corrections = corrRes.ok ? await corrRes.json() : { corrections: [] };

  logAdminSurveyInsightsEvent('success', { reportId: query.reportId, adminId: ctx.admin.id });

  return corsJson(req, 200, {
    report_id: query.reportId,
    context,
    twin_feed: twin,
    corrections: corrections.corrections ?? [],
    flags: buildSurveyInsightFlags(context, twin),
  });
}