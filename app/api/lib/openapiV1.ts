export const OPENAPI_V1_PATH = '/api/openapi/v1';
export const OPENAPI_V1_METHODS = 'GET, OPTIONS';

export const OPENAPI_V1_PROBE = {
  path: OPENAPI_V1_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  openapiVersion: '3.0.3' as const,
  apiVersion: 'v1' as const,
  title: 'Solaris CET Public API' as const,
  contentType: 'application/json' as const,
};

export function buildOpenApiV1Spec() {
  return {
    openapi: OPENAPI_V1_PROBE.openapiVersion,
    info: {
      title: OPENAPI_V1_PROBE.title,
      version: OPENAPI_V1_PROBE.apiVersion,
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
        Price: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            asset: { type: 'string' },
            priceUsd: { type: 'number' },
            updatedAt: { type: 'string', format: 'date-time' },
            source: { type: 'string' },
          },
          required: ['version', 'asset', 'priceUsd', 'updatedAt', 'source'],
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            asset: { type: 'string' },
            from: { type: 'string', nullable: true },
            to: { type: 'string', nullable: true },
            amount: { type: 'string' },
            status: { type: 'string' },
            txHash: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'asset', 'amount', 'status', 'createdAt'],
        },
      },
    },
    security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
    paths: {
      '/api/v1/price': {
        get: {
          summary: 'Get CET price',
          responses: {
            '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/Price' } } } },
            '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '429': { description: 'Rate limited', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/v1/stats': {
        get: {
          summary: 'Get usage statistics',
          responses: {
            '200': { description: 'OK' },
            '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '429': { description: 'Rate limited', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/v1/transactions': {
        get: {
          summary: 'List transactions',
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
          summary: 'Create a transaction',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    from: { type: 'string', nullable: true },
                    to: { type: 'string', nullable: true },
                    amount: { type: 'string' },
                    txHash: { type: 'string', nullable: true },
                  },
                  required: ['amount'],
                },
              },
            },
          },
          responses: {
            '201': { description: 'Created' },
            '400': { description: 'Invalid request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '429': { description: 'Rate limited', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/v1/webhooks': {
        get: {
          summary: 'List webhook endpoints',
          responses: {
            '200': { description: 'OK' },
            '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '429': { description: 'Rate limited', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        post: {
          summary: 'Create a webhook endpoint',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: {
            '201': { description: 'Created' },
            '400': { description: 'Invalid request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '429': { description: 'Rate limited', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        delete: {
          summary: 'Delete a webhook endpoint',
          parameters: [{ name: 'id', in: 'query', required: true, schema: { type: 'string' } }],
          responses: {
            '204': { description: 'Deleted' },
            '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '429': { description: 'Rate limited', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/v1/webhooks/deliveries': {
        get: {
          summary: 'List webhook deliveries for an endpoint',
          parameters: [
            { name: 'endpointId', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 200 } },
          ],
          responses: {
            '200': { description: 'OK' },
            '400': { description: 'Invalid request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '429': { description: 'Rate limited', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
    },
  };
}