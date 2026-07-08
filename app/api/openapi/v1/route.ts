import { buildOpenApiV1Spec, OPENAPI_V1_PROBE } from '@/api/lib/openapiV1';
import { errorResponsePublic, jsonResponsePublic, optionsResponsePublic } from '@/api/lib/publicApiResponse';

export { OPENAPI_V1_PATH, OPENAPI_V1_PROBE } from '@/api/lib/openapiV1';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponsePublic(req, OPENAPI_V1_PROBE.methods.join(', '), 'Content-Type');
  }
  if (req.method !== 'GET') return errorResponsePublic(req, 405, 'invalid_request', 'Method not allowed');
  return jsonResponsePublic(req, buildOpenApiV1Spec(), 200);
}