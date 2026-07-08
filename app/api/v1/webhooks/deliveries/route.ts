import { requirePublicApiKey } from '@/api/lib/publicApiAuth';
import { recordPublicApiUsage } from '@/api/lib/publicApiMetrics';
import { decideRateLimit, rateLimitHeaders } from '@/api/lib/publicApiRateLimit';
import { errorResponsePublic, jsonResponsePublic, optionsResponsePublic, rateLimitedResponsePublic } from '@/api/lib/publicApiResponse';
import {
  buildPublicV1WebhookDeliveriesBody,
  parsePublicV1WebhookDeliveriesLimit,
  PUBLIC_V1_WEBHOOK_DELIVERIES_PROBE,
} from '../../../lib/publicV1WebhookDeliveries';
import { listWebhookDeliveries } from '@/api/lib/publicWebhooksStore';

export { PUBLIC_V1_WEBHOOK_DELIVERIES_PATH, PUBLIC_V1_WEBHOOK_DELIVERIES_PROBE } from '@/api/lib/publicV1WebhookDeliveries';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const start = Date.now();
  if (req.method === 'OPTIONS') {
    return optionsResponsePublic(req, PUBLIC_V1_WEBHOOK_DELIVERIES_PROBE.methods.join(', '), 'Content-Type, Authorization, X-API-Key');
  }
  if (req.method !== 'GET') return errorResponsePublic(req, 405, 'invalid_request', 'Method not allowed');

  const auth = await requirePublicApiKey(req);
  if (auth instanceof Response) {
    await recordPublicApiUsage({
      apiKeyId: null,
      userId: null,
      method: req.method,
      path: PUBLIC_V1_WEBHOOK_DELIVERIES_PROBE.path,
      status: auth.status,
      latencyMs: Date.now() - start,
    });
    return auth;
  }

  const d = decideRateLimit({
    req,
    bucket: PUBLIC_V1_WEBHOOK_DELIVERIES_PROBE.rateLimitBucket,
    keyPart: auth.apiKeyId,
    limit: PUBLIC_V1_WEBHOOK_DELIVERIES_PROBE.rateLimit,
    windowSeconds: PUBLIC_V1_WEBHOOK_DELIVERIES_PROBE.rateWindowSeconds,
  });
  if (!d.ok) {
    await recordPublicApiUsage({
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      method: req.method,
      path: PUBLIC_V1_WEBHOOK_DELIVERIES_PROBE.path,
      status: 429,
      latencyMs: Date.now() - start,
    });
    return rateLimitedResponsePublic(req, d);
  }

  const url = new URL(req.url);
  const endpointId = (url.searchParams.get(PUBLIC_V1_WEBHOOK_DELIVERIES_PROBE.endpointIdParam) ?? '').trim();
  if (!endpointId) return errorResponsePublic(req, 400, 'invalid_request', 'Missing endpointId');
  const limit = parsePublicV1WebhookDeliveriesLimit(url.searchParams.get('limit'));
  const items = await listWebhookDeliveries(auth.userId, endpointId, limit);
  const status = 200;
  await recordPublicApiUsage({
    apiKeyId: auth.apiKeyId,
    userId: auth.userId,
    method: req.method,
    path: PUBLIC_V1_WEBHOOK_DELIVERIES_PROBE.path,
    status,
    latencyMs: Date.now() - start,
  });
  return jsonResponsePublic(req, buildPublicV1WebhookDeliveriesBody(items), status, rateLimitHeaders(d));
}