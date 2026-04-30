import { errorResponsePublic, jsonResponsePublic, optionsResponsePublic } from '../../lib/publicApiResponse';

export const config = { runtime: 'nodejs' };

function spec() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Solaris CET Public API',
      version: 'v2',
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
    },
  };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponsePublic(req, 'GET, OPTIONS', 'Content-Type');
  }
  if (req.method !== 'GET') return errorResponsePublic(req, 405, 'invalid_request', 'Method not allowed');
  return jsonResponsePublic(req, spec(), 200);
}
