/** OpenAPI 3.1 paths for `/api/survey/*` bridge contract (S6). */

export const SURVEY_API_VERSION = '1.0.0';

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
  'twin-stream',
  'twin-webhook',
  'twin-webhook-deliveries',
  'twin-agent',
  'twin-agent-execute',
  'twin-agent-decisions',
  'offline-manifest',
] as const;

export type SurveyRouteId = (typeof SURVEY_ROUTE_IDS)[number];

const BRIDGE_PATH_OVERRIDES: Partial<Record<SurveyRouteId, string>> = {
  'permit-pack': '/api/survey/permit-pack',
  'installer-me': '/api/survey/installer/me',
  'twin-feed': '/api/survey/twin-feed',
  'twin-events': '/api/survey/twin-events',
  'twin-stream': '/api/survey/twin-stream',
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
    '/api/survey/batch': {
      post: {
        summary: 'Batch manifest + photos',
        parameters: [installerKeyParam],
        requestBody: {
          required: true,
          content: { 'multipart/form-data': { schema: { type: 'object' } } },
        },
        responses: { '200': jsonResponse },
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
  };
}

export function buildSurveyOpenApiSpec() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'SOLARIS CET Survey Bridge API',
      version: SURVEY_API_VERSION,
      description:
        'Stable Node bridge over Python survey-engine. Contract for installers, CRM, and future Digital Twin (D10).',
    },
    servers: [{ url: '/' }],
    tags: [{ name: 'survey', description: 'Field survey + AHJ + orchestration' }],
    paths: buildSurveyOpenApiPaths(),
  };
}