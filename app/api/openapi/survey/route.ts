import { buildSurveyOpenApiSpec } from '../../lib/surveyOpenApi';
import { errorResponsePublic, jsonResponsePublic, optionsResponsePublic } from '../../lib/publicApiResponse';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponsePublic(req, 'GET, OPTIONS', 'Content-Type');
  }
  if (req.method !== 'GET') {
    return errorResponsePublic(req, 405, 'invalid_request', 'Method not allowed');
  }
  return jsonResponsePublic(req, buildSurveyOpenApiSpec(), 200);
}