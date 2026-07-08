import { buildOpenApiV2Spec, OPENAPI_V2_PROBE } from '@/api/lib/openapiV2';
import { errorResponsePublic, jsonResponsePublic, optionsResponsePublic } from '@/api/lib/publicApiResponse';

export { OPENAPI_V2_PATH, OPENAPI_V2_PROBE } from '@/api/lib/openapiV2';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponsePublic(req, OPENAPI_V2_PROBE.methods.join(', '), 'Content-Type');
  }
  if (req.method !== 'GET') return errorResponsePublic(req, 405, 'invalid_request', 'Method not allowed');
  return jsonResponsePublic(req, buildOpenApiV2Spec(), 200);
}