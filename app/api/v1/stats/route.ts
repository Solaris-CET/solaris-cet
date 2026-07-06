import { requirePublicApiKey } from '../../lib/publicApiAuth';
import { aggregatePublicApiUsage, recordPublicApiUsage } from '../../lib/publicApiMetrics';
import { decideRateLimit, rateLimitHeaders } from '../../lib/publicApiRateLimit';
import { errorResponsePublic, jsonResponsePublic, optionsResponsePublic, rateLimitedResponsePublic } from '../../lib/publicApiResponse';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const start = Date.now();
  if (req.method === 'OPTIONS') {
    return optionsResponsePublic(req, 'GET, OPTIONS', 'Content-Type, Authorization, X-API-Key');
  }
  if (req.method !== 'GET') return errorResponsePublic(req, 405, 'invalid_request', 'Method not allowed');

  const auth = await requirePublicApiKey(req);
  if (auth instanceof Response) {
    await recordPublicApiUsage({ apiKeyId: null, userId: null, method: req.method, path: '/api/v1/stats', status: auth.status, latencyMs: Date.now() - start });
    return auth;
  }

  const d = decideRateLimit({ req, bucket: 'public-v1-stats', keyPart: auth.apiKeyId, limit: 60, windowSeconds: 60 });
  if (!d.ok) {
    await recordPublicApiUsage({ apiKeyId: auth.apiKeyId, userId: auth.userId, method: req.method, path: '/api/v1/stats', status: 429, latencyMs: Date.now() - start });
    return rateLimitedResponsePublic(req, d);
  }

  const sinceMs = Date.now() - 24 * 60 * 60 * 1000;
  const global = aggregatePublicApiUsage({ sinceMs, pathPrefix: '/api/v1/' });
  const mine = aggregatePublicApiUsage({ sinceMs, apiKeyId: auth.apiKeyId, pathPrefix: '/api/v1/' });
  const body = {
    version: 'v1',
    window: { since: new Date(sinceMs).toISOString(), until: new Date().toISOString() },
    global,
    apiKey: { id: auth.apiKeyId, usage: mine },
  };
  const status = 200;
  await recordPublicApiUsage({ apiKeyId: auth.apiKeyId, userId: auth.userId, method: req.method, path: '/api/v1/stats', status, latencyMs: Date.now() - start });
  return jsonResponsePublic(req, body, status, rateLimitHeaders(d));
}

