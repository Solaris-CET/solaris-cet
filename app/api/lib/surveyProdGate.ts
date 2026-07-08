import { buildSurveyOpenApiPaths, SURVEY_ROUTE_IDS, surveyBridgePath } from './surveyOpenApi';

/** Critical paths that must pass on every production deploy gate run. */
export const SURVEY_GATE_CRITICAL_PATHS = [
  '/api/survey/health',
  '/api/survey/jurisdictions',
  '/api/survey/stats',
] as const;

/** OpenAPI paths required when `/api/openapi/survey` is healthy (aligned with scripts/lib/surveyRouteManifest.mjs). */
export const OPENAPI_GATE_REQUIRED_PATHS = [
  '/api/survey/health',
  '/api/survey/twin-feed',
  '/api/survey/twin-events',
  '/api/survey/twin-stream',
  '/api/survey/twin-webhook',
  '/api/survey/twin-webhook/deliveries',
  '/api/survey/twin-agent',
  '/api/survey/twin-agent/execute',
  '/api/survey/twin-agent/decisions',
  '/api/survey/offline-manifest',
  '/api/survey/context',
  '/api/survey/orchestrate',
  '/api/survey/installer/me',
  '/api/admin/survey-insights',
  '/api/admin/surveys',
  '/api/openapi/survey',
] as const;

export type SurveyGateProbeRoute = {
  path: string;
  method: string;
  label: string;
  required?: string[];
  critical: boolean;
  probeQuery?: Record<string, string>;
};

export function listSurveyBridgePaths(): string[] {
  return SURVEY_ROUTE_IDS.map(surveyBridgePath);
}

export function missingOpenApiPaths(required: readonly string[]): string[] {
  const paths = buildSurveyOpenApiPaths();
  return required.filter((path) => !(path in paths));
}

export function uncoveredCriticalPaths(registered: readonly string[]): string[] {
  return SURVEY_GATE_CRITICAL_PATHS.filter((path) => !registered.includes(path));
}

export function buildGateUrl(
  base: string,
  route: Pick<SurveyGateProbeRoute, 'path' | 'probeQuery'>,
): string {
  const url = new URL(route.path, base.endsWith('/') ? base : `${base}/`);
  for (const [key, value] of Object.entries(route.probeQuery ?? {})) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

export function isCriticalGateRoute(route: SurveyGateProbeRoute): boolean {
  return route.critical;
}