import { resolveSurveyEngineUrl } from './surveyHealth';

export const SURVEY_TRACES_PATH = '/api/survey/traces';
export const SURVEY_TRACES_METHODS = 'GET, OPTIONS';

export const SURVEY_TRACES_PROBE = {
  path: SURVEY_TRACES_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  enginePath: '/traces',
};

export type SurveyTraceSummary = {
  schema: string;
  report_id?: string;
  trace_id: string | null;
  spans: Array<Record<string, unknown>>;
  span_count?: number;
  total_duration_ms?: number;
  total_cost_usd?: number;
};

export function resolveSurveyTracesEngineUrl(env: NodeJS.ProcessEnv = process.env): string {
  return resolveSurveyEngineUrl(env);
}

export function buildSurveyTracesEngineUrl(engineUrl: string, query: URLSearchParams): string {
  const base = engineUrl.replace(/\/$/, '');
  return `${base}${SURVEY_TRACES_PROBE.enginePath}?${query.toString()}`;
}

export async function fetchSurveyTracesFromEngine(
  engineUrl: string,
  params: { reportId?: string; traceId?: string; limit?: number },
  fetchFn: typeof fetch = fetch,
): Promise<SurveyTraceSummary> {
  const q = new URLSearchParams();
  if (params.reportId) q.set('report_id', params.reportId);
  if (params.traceId) q.set('trace_id', params.traceId);
  if (params.limit != null) q.set('limit', String(params.limit));
  const res = await fetchFn(buildSurveyTracesEngineUrl(engineUrl, q), {
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(`Engine traces ${res.status}`);
  }
  return (await res.json()) as SurveyTraceSummary;
}