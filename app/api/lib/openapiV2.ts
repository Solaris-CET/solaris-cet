import { buildSurveyOpenApiPaths } from './surveyOpenApi';

export const OPENAPI_V2_PATH = '/api/openapi/v2';
export const OPENAPI_V2_METHODS = 'GET, OPTIONS';

export const OPENAPI_V2_PROBE = {
  path: OPENAPI_V2_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  openapiVersion: '3.1.0' as const,
  apiVersion: 'v2' as const,
  title: 'Solaris CET Public API' as const,
  contentType: 'application/json' as const,
};

export function buildOpenApiV2Spec() {
  return {
    openapi: OPENAPI_V2_PROBE.openapiVersion,
    info: {
      title: OPENAPI_V2_PROBE.title,
      version: OPENAPI_V2_PROBE.apiVersion,
      description: 'Public, versioned API with API-key auth, rate limiting, and webhooks.',
    },
    servers: [{ url: '/' }],
    components: {
      securitySchemes: {
        ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
        BearerAuth: { type: 'http', scheme: 'bearer' },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: {},
              },
              required: ['code', 'message'],
            },
          },
          required: ['error'],
        },
      },
    },
    security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
    paths: {
      '/api/v2/ai/oracle': {
        post: {
          summary: 'Ask AI Oracle (v2)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string' },
                    conversation: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: { role: { type: 'string' }, content: { type: 'string' } },
                        required: ['role', 'content'],
                      },
                    },
                    model: { type: 'string', enum: ['auto', 'grok', 'gemini'] },
                    forceFresh: { type: 'boolean' },
                  },
                  required: ['query'],
                },
              },
            },
          },
          responses: {
            '200': { description: 'OK' },
            '400': { description: 'Invalid request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '429': { description: 'Rate limited', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '500': { description: 'Not configured', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '502': { description: 'Upstream error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/v2/price': {
        get: {
          summary: 'Get CET price (v2)',
          responses: {
            '200': { description: 'OK' },
            '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '429': { description: 'Rate limited', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/v2/stats': {
        get: {
          summary: 'Get usage statistics (v2)',
          responses: {
            '200': { description: 'OK' },
            '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '429': { description: 'Rate limited', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/v2/transactions': {
        get: {
          summary: 'List transactions (v2)',
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 200 } },
            { name: 'cursor', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'OK' },
            '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '429': { description: 'Rate limited', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        post: {
          summary: 'Create a transaction (v2)',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: {
            '201': { description: 'Created' },
            '400': { description: 'Invalid request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '429': { description: 'Rate limited', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      ...buildSurveyOpenApiPaths(),
    },
  };
}