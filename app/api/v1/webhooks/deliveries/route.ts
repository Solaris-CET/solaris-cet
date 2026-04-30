import { requirePublicApiKey } from '../../../lib/publicApiAuth';
import { recordPublicApiUsage } from '../../../lib/publicApiMetrics';
import { decideRateLimit, rateLimitHeaders } from '../../../lib/publicApiRateLimit';
import { errorResponsePublic, jsonResponsePublic, optionsResponsePublic, rateLimitedResponsePublic } from '../../../lib/publicApiResponse';
import { listWebhookDeliveries } from '../../../lib/publicWebhooksStore';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const start = Date.now();
  if (req.method === 'OPTIONS') {
    return optionsResponsePublic(req, 'GET, OPTIONS', 'Content-Type, Authorization, X-API-Key');
  }
  if (req.method !== 'GET') return errorResponsePublic(req, 405, 'invalid_request', 'Method not allowed');

  const auth = await requirePublicApiKey(req);
  if (auth instanceof Response) {
    await recordPublicApiUsage({ apiKeyId: null, userId: null, method: req.method, path: '/api/v1/webhooks/deliveries', status: auth.status, latencyMs: Date.now() - start });
    return auth;
  }

  const d = decideRateLimit({ req, bucket: 'public-v1-webhook-deliveries', keyPart: auth.apiKeyId, limit: 120, windowSeconds: 60 });
  if (!d.ok) {
    await recordPublicApiUsage({ apiKeyId: auth.apiKeyId, userId: auth.userId, method: req.method, path: '/api/v1/webhooks/deliveries', status: 429, latencyMs: Date.now() - start });
    return rateLimitedResponsePublic(req, d);
  }

  const url = new URL(req.url);
  const endpointId = (url.searchParams.get('endpointId') ?? '').trim();
  if (!endpointId) return errorResponsePublic(req, 400, 'invalid_request', 'Missing endpointId');
  const limit = Number(url.searchParams.get('limit') ?? '50');
  const items = await listWebhookDeliveries(auth.userId, endpointId, limit);
  const status = 200;
  await recordPublicApiUsage({ apiKeyId: auth.apiKeyId, userId: auth.userId, method: req.method, path: '/api/v1/webhooks/deliveries', status, latencyMs: Date.now() - start });
  return jsonResponsePublic(req, { version: 'v1', items }, status, rateLimitHeaders(d));
}

