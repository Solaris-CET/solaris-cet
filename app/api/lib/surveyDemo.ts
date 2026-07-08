import { buildSurveyBatchFileUrl } from './surveyBatch';
import { resolveSurveyEngineUrl, SURVEY_HEALTH_PROBE } from './surveyHealth';

export const SURVEY_DEMO_PATH = '/api/survey/demo';
export const SURVEY_DEMO_METHODS = 'POST, OPTIONS';

export const SURVEY_DEMO_PROBE = {
  path: SURVEY_DEMO_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  cacheControl: 'no-store' as const,
  unreachableError: 'survey-engine unreachable' as const,
  invalidEngineResponseError: 'Invalid engine response' as const,
  engineDemoFailedError: 'Engine demo failed' as const,
  demoVerdict: 'Demo — date sample' as const,
  demoCapacityKwp: 6,
  demoAnnualKwh: 7200,
  demoRoutingReason: 'demo/sample-data' as const,
  demoCostUsd: 0,
  fetchTimeoutMs: 120_000,
  orchestrateTimeoutMs: 8000,
  unreachableStatus: 503,
};

export type SurveyDemoEnginePayload = {
  report_id: string;
  pdf_path: string;
  score: number;
};

export function resolveSurveyDemoEngineUrl(env: NodeJS.ProcessEnv = process.env): string {
  return resolveSurveyEngineUrl(env);
}

export function buildSurveyDemoEngineUrl(engineUrl: string): string {
  return `${engineUrl.replace(/\/$/, '')}/demo`;
}

export function buildSurveyDemoOrchestrateUrl(engineUrl: string, reportId: string): string {
  return `${engineUrl.replace(/\/$/, '')}/orchestrate/${encodeURIComponent(reportId)}`;
}

export function extractSurveyDemoPdfFilename(pdfPath: string, reportId: string): string {
  return pdfPath.split(/[/\\]/).pop() || `RAPORT_${reportId}.pdf`;
}

export function buildSurveyDemoAhjFilename(reportId: string): string {
  return `AHJ_${reportId}.json`;
}

export function buildSurveyDemoSuccessPayload(params: {
  reportId: string;
  pdfFilename: string;
  score: number;
  orchestration?: Record<string, unknown>;
}) {
  const ahjFilename = buildSurveyDemoAhjFilename(params.reportId);
  return {
    report_id: params.reportId,
    pdf_filename: params.pdfFilename,
    ahj_filename: ahjFilename,
    score: params.score,
    verdict: SURVEY_DEMO_PROBE.demoVerdict,
    capacity_kwp: SURVEY_DEMO_PROBE.demoCapacityKwp,
    annual_kwh: SURVEY_DEMO_PROBE.demoAnnualKwh,
    routing_reason: SURVEY_DEMO_PROBE.demoRoutingReason,
    cost_usd: SURVEY_DEMO_PROBE.demoCostUsd,
    pdf_url: buildSurveyBatchFileUrl(params.pdfFilename),
    ahj_url: buildSurveyBatchFileUrl(ahjFilename),
    orchestration: params.orchestration,
    demo: true as const,
  };
}

export function buildSurveyDemoUnreachablePayload(engineUrl: string) {
  return {
    error: SURVEY_DEMO_PROBE.unreachableError,
    engine_url: engineUrl,
    platform: SURVEY_HEALTH_PROBE.platform,
  };
}