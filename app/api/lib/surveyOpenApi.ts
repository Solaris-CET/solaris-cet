/** OpenAPI 3.1 paths for `/api/survey/*` bridge contract (S6). */

import { ADMIN_SURVEY_INSIGHTS_OPENAPI } from './adminSurveyInsights';
import { ADMIN_SURVEYS_OPENAPI } from './adminSurveys';
import { SURVEY_BATCH_OPENAPI } from './surveyBatch';

export const SURVEY_API_VERSION = '1.0.0';
export const SURVEY_OPENAPI_VERSION = '3.1.0';
export const SURVEY_OPENAPI_TITLE = 'SOLARIS CET Survey Bridge API';
export const SURVEY_OPENAPI_TAG = 'survey';
export const SURVEY_OPENAPI_TAG_DESCRIPTION = 'Field survey + AHJ + orchestration';
export const SURVEY_ADMIN_OPENAPI_TAG = 'admin-survey';
export const SURVEY_ADMIN_OPENAPI_TAG_DESCRIPTION = 'Admin CRM + survey-engine aggregates';
export const SURVEY_OPENAPI_META_PATH = '/api/openapi/survey';
export const SURVEY_OPENAPI_META_TAG = 'meta';
export const SURVEY_OPENAPI_META_TAG_DESCRIPTION = 'Contract discovery endpoints';

export const SURVEY_ROUTE_IDS = [
  'health',
  'stats',
  'dashboard',
  'jurisdictions',
  'generate',
  'demo',
  'batch',
  'files',
  'crm',
  'context',
  'orchestrate',
  'permit-pack',
  'corrections',
  'twin-feed',
  'installer-me',
  'twin-events',
  'twin-replay',
  'twin-stream',
  'router-stats',
  'twin-webhook',
  'twin-webhook-deliveries',
  'twin-agent',
  'twin-agent-execute',
  'twin-agent-decisions',
  'offline-manifest',
] as const;

export type SurveyRouteId = (typeof SURVEY_ROUTE_IDS)[number];

export type SurveyOpenApiSpec = {
  openapi: string;
  info: { title: string; version: string; description: string };
  servers: { url: string }[];
  tags: { name: string; description: string }[];
  paths: Record<string, unknown>;
};

export type SurveyHttpMethod = 'get' | 'post';

export function isSurveyRouteId(value: string): value is SurveyRouteId {
  return (SURVEY_ROUTE_IDS as readonly string[]).includes(value);
}

export function listSurveyBridgePaths(): string[] {
  return SURVEY_ROUTE_IDS.map(surveyBridgePath);
}

export function hasOpenApiOperation(
  paths: Record<string, unknown>,
  path: string,
  method: SurveyHttpMethod,
): boolean {
  const entry = paths[path] as Record<string, unknown> | undefined;
  return Boolean(entry?.[method]);
}

export function openApiPathSummaries(paths: Record<string, unknown>): string[] {
  const summaries: string[] = [];
  for (const entry of Object.values(paths)) {
    const ops = entry as Record<string, { summary?: string } | undefined>;
    for (const method of ['get', 'post'] as const) {
      const summary = ops[method]?.summary;
      if (summary) summaries.push(summary);
    }
  }
  return summaries;
}

const BRIDGE_PATH_OVERRIDES: Partial<Record<SurveyRouteId, string>> = {
  'permit-pack': '/api/survey/permit-pack',
  'installer-me': '/api/survey/installer/me',
  'twin-feed': '/api/survey/twin-feed',
  'twin-events': '/api/survey/twin-events',
  'twin-replay': '/api/survey/twin-replay',
  'twin-stream': '/api/survey/twin-stream',
  'router-stats': '/api/survey/router/stats',
  'twin-webhook': '/api/survey/twin-webhook',
  'twin-webhook-deliveries': '/api/survey/twin-webhook/deliveries',
  'twin-agent': '/api/survey/twin-agent',
  'twin-agent-execute': '/api/survey/twin-agent/execute',
  'twin-agent-decisions': '/api/survey/twin-agent/decisions',
  'offline-manifest': '/api/survey/offline-manifest',
};

export function surveyBridgePath(id: SurveyRouteId): string {
  return BRIDGE_PATH_OVERRIDES[id] ?? `/api/survey/${id}`;
}

const jsonResponse = { description: 'JSON response' };
const installerKeyParam = {
  name: 'X-Installer-Key',
  in: 'header',
  schema: { type: 'string' },
  required: false,
};
const adminAuthParam = {
  name: 'Authorization',
  in: 'header',
  schema: { type: 'string' },
  required: true,
  description: 'Admin bearer token',
};

export function buildOpenApiSurveyMetaPaths(): Record<string, unknown> {
  return {
    '/api/openapi/survey': {
      get: {
        tags: [SURVEY_OPENAPI_META_TAG],
        summary: 'Survey bridge OpenAPI 3.1 document',
        responses: {
          '200': {
            description: 'OpenAPI 3.1 JSON document',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
          '405': { description: 'Method not allowed' },
        },
      },
    },
  };
}

export function buildAdminSurveyOpenApiPaths(): Record<string, unknown> {
  return {
    '/api/admin/survey-insights': {
      get: {
        tags: [ADMIN_SURVEY_INSIGHTS_OPENAPI.tag],
        summary: ADMIN_SURVEY_INSIGHTS_OPENAPI.summary,
        parameters: [
          adminAuthParam,
          {
            name: ADMIN_SURVEY_INSIGHTS_OPENAPI.reportIdParam,
            in: 'query',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': jsonResponse,
          '400': jsonResponse,
          '401': jsonResponse,
          '403': jsonResponse,
          '404': jsonResponse,
          '502': jsonResponse,
        },
      },
    },
    '/api/admin/surveys': {
      get: {
        tags: [ADMIN_SURVEYS_OPENAPI.tag],
        summary: ADMIN_SURVEYS_OPENAPI.summary,
        parameters: [
          adminAuthParam,
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } },
          { name: 'installer_id', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': jsonResponse,
          '401': jsonResponse,
          '403': jsonResponse,
          '502': jsonResponse,
        },
      },
    },
  };
}

export function buildSurveyOpenApiPaths(): Record<string, unknown> {
  return {
    '/api/survey/health': {
      get: { summary: 'Survey engine health proxy', responses: { '200': jsonResponse, '503': jsonResponse } },
    },
    '/api/survey/stats': {
      get: { summary: 'Public survey stats', responses: { '200': jsonResponse } },
    },
    '/api/survey/dashboard': {
      get: { summary: 'Survey dashboard data', responses: { '200': jsonResponse } },
    },
    '/api/survey/jurisdictions': {
      get: { summary: 'Romania jurisdictions list', responses: { '200': jsonResponse } },
    },
    '/api/survey/generate': {
      post: {
        summary: 'Generate PDF + AHJ from photos',
        parameters: [installerKeyParam],
        requestBody: {
          required: true,
          content: { 'multipart/form-data': { schema: { type: 'object' } } },
        },
        responses: { '200': jsonResponse, '400': jsonResponse, '503': jsonResponse },
      },
    },
    '/api/survey/demo': {
      post: { summary: 'Demo report (sample data)', responses: { '200': jsonResponse, '503': jsonResponse } },
    },
    [SURVEY_BATCH_OPENAPI.path]: {
      post: {
        ...SURVEY_BATCH_OPENAPI.post,
        tags: [SURVEY_OPENAPI_TAG],
        parameters: [installerKeyParam],
        responses: {
          '200': jsonResponse,
          '405': jsonResponse,
          '415': jsonResponse,
          '503': jsonResponse,
        },
      },
    },
    '/api/survey/files': {
      get: {
        summary: 'Download PDF or AHJ JSON',
        parameters: [{ name: 'file', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'File bytes' }, '404': jsonResponse },
      },
    },
    '/api/survey/crm': {
      post: {
        summary: 'Register survey lead in CRM',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': jsonResponse, '400': jsonResponse },
      },
    },
    '/api/survey/context': {
      get: {
        summary: 'Unified report context (S1)',
        parameters: [{ name: 'report_id', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { '200': jsonResponse, '404': jsonResponse },
      },
    },
    '/api/survey/orchestrate': {
      get: {
        summary: 'OODA orchestration plan (S5)',
        parameters: [{ name: 'report_id', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { '200': jsonResponse, '404': jsonResponse },
      },
    },
    '/api/survey/permit-pack': {
      get: {
        summary: 'Permit-ready ZIP export',
        parameters: [{ name: 'report_id', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'ZIP archive' }, '404': jsonResponse },
      },
    },
    '/api/survey/corrections': {
      get: {
        summary: 'List technician corrections',
        parameters: [{ name: 'report_id', in: 'query', schema: { type: 'string' } }],
        responses: { '200': jsonResponse },
      },
      post: {
        summary: 'Log technician correction',
        parameters: [installerKeyParam],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': jsonResponse, '400': jsonResponse },
      },
    },
    '/api/survey/twin-feed': {
      get: {
        summary: 'Digital twin feed snapshot (D10 prep)',
        parameters: [{ name: 'report_id', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { '200': jsonResponse, '404': jsonResponse },
      },
    },
    '/api/survey/installer/me': {
      get: {
        summary: 'Authenticated installer SaaS profile',
        parameters: [installerKeyParam],
        responses: { '200': jsonResponse, '401': jsonResponse, '503': jsonResponse },
      },
    },
    '/api/survey/twin-events': {
      get: {
        summary: 'Twin runtime event log (D10)',
        parameters: [
          { name: 'report_id', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': jsonResponse },
      },
    },
    '/api/survey/twin-replay': {
      get: {
        summary: 'Twin event replay from sequence (HARD-001)',
        parameters: [
          { name: 'from_seq', in: 'query', schema: { type: 'integer' } },
          { name: 'report_id', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': jsonResponse },
      },
    },
    '/api/survey/router/stats': {
      get: {
        summary: 'Dynamic model router telemetry (HARD-004)',
        responses: { '200': jsonResponse, '503': jsonResponse },
      },
    },
    '/api/survey/twin-stream': {
      get: {
        summary: 'Twin SSE stream — snapshot or persistent (D10)',
        parameters: [
          { name: 'report_id', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'persistent', in: 'query', schema: { type: 'string', enum: ['0', '1', 'true'] } },
        ],
        responses: { '200': { description: 'text/event-stream' }, '404': jsonResponse },
      },
    },
    '/api/survey/twin-webhook': {
      post: {
        summary: 'Inbound CRM twin webhook',
        responses: { '200': jsonResponse, '400': jsonResponse, '401': jsonResponse, '503': jsonResponse },
      },
    },
    '/api/survey/twin-webhook/deliveries': {
      get: {
        summary: 'Twin webhook delivery log',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'direction', in: 'query', schema: { type: 'string', enum: ['inbound', 'outbound'] } },
        ],
        responses: { '200': jsonResponse },
      },
    },
    '/api/survey/twin-agent': {
      get: {
        summary: 'Twin AI agent plan (D10 + S5)',
        parameters: [{ name: 'report_id', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { '200': jsonResponse, '404': jsonResponse },
      },
    },
    '/api/survey/twin-agent/execute': {
      post: {
        summary: 'Execute twin agent action',
        parameters: [{ name: 'report_id', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { '200': jsonResponse, '400': jsonResponse, '502': jsonResponse },
      },
    },
    '/api/survey/twin-agent/decisions': {
      get: {
        summary: 'Twin agent decision log',
        parameters: [
          { name: 'report_id', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': jsonResponse },
      },
    },
    '/api/survey/offline-manifest': {
      get: {
        summary: 'Survey offline PWA manifest (precache + queue)',
        responses: { '200': jsonResponse },
      },
    },
    ...buildAdminSurveyOpenApiPaths(),
    ...buildOpenApiSurveyMetaPaths(),
  };
}

export function buildSurveyOpenApiSpec(): SurveyOpenApiSpec {
  return {
    openapi: SURVEY_OPENAPI_VERSION,
    info: {
      title: SURVEY_OPENAPI_TITLE,
      version: SURVEY_API_VERSION,
      description:
        'Stable Node bridge over Python survey-engine. Contract for installers, CRM, and future Digital Twin (D10).',
    },
    servers: [{ url: '/' }],
    tags: [
      { name: SURVEY_OPENAPI_TAG, description: SURVEY_OPENAPI_TAG_DESCRIPTION },
      { name: SURVEY_ADMIN_OPENAPI_TAG, description: SURVEY_ADMIN_OPENAPI_TAG_DESCRIPTION },
      { name: SURVEY_OPENAPI_META_TAG, description: SURVEY_OPENAPI_META_TAG_DESCRIPTION },
    ],
    paths: buildSurveyOpenApiPaths(),
  };
}