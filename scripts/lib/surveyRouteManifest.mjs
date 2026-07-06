/**
 * Canonical `/api/survey/*` routes for prod deploy gate.
 * Keep aligned with `app/api/lib/surveyOpenApi.ts` SURVEY_ROUTE_IDS.
 */

/** @type {Array<{ path: string; method: string; label: string; required?: string[]; critical: boolean; probeQuery?: Record<string, string> }>} */
export const SURVEY_GATE_ROUTES = [
  { path: '/api/survey/health', method: 'GET', label: 'health', required: ['engine'], critical: true },
  { path: '/api/survey/jurisdictions', method: 'GET', label: 'jurisdictions', required: ['jurisdictions'], critical: true },
  { path: '/api/survey/stats', method: 'GET', label: 'stats', required: ['stats'], critical: true },
  { path: '/api/openapi/survey', method: 'GET', label: 'openapi-survey', required: ['paths'], critical: true },
  { path: '/api/survey/dashboard', method: 'GET', label: 'dashboard', required: ['stats'], critical: false },
  { path: '/api/survey/twin-events', method: 'GET', label: 'twin-events', required: ['events'], critical: false },
  { path: '/api/survey/twin-webhook/deliveries', method: 'GET', label: 'twin-webhook-deliveries', required: ['deliveries'], critical: false },
  { path: '/api/survey/twin-agent/decisions', method: 'GET', label: 'twin-agent-decisions', required: ['decisions'], critical: false },
  { path: '/api/survey/offline-manifest', method: 'GET', label: 'offline-manifest', required: ['manifest'], critical: false },
  { path: '/api/survey/installer/me', method: 'GET', label: 'installer-me', required: ['installer'], critical: false },
];

/** OpenAPI paths that must exist when openapi route is up */
export const OPENAPI_REQUIRED_PATHS = [
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
];

export function buildGateUrl(base, route) {
  const url = new URL(route.path, base.endsWith('/') ? base : `${base}/`);
  for (const [k, v] of Object.entries(route.probeQuery ?? {})) {
    url.searchParams.set(k, v);
  }
  return url.toString();
}