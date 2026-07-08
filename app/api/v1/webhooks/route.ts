import { requirePublicApiKey } from '@/api/lib/publicApiAuth';
import { recordPublicApiUsage } from '@/api/lib/publicApiMetrics';
import { decideRateLimit, rateLimitHeaders } from '@/api/lib/publicApiRateLimit';
import {
  allowedOriginFromReq,
  errorResponsePublic,
  jsonResponsePublic,
  optionsResponsePublic,
  rateLimitedResponsePublic,
} from '../../lib/publicApiResponse';
import {
  buildPublicV1WebhookCreateBody,
  buildPublicV1WebhooksListBody,
  PUBLIC_V1_WEBHOOKS_PROBE,
  publicV1WebhookCreateSchema,
} from '../../lib/publicV1Webhooks';
import { createWebhookEndpoint, deleteWebhookEndpoint, listWebhookEndpoints } from '@/api/lib/publicWebhooksStore';

export { PUBLIC_V1_WEBHOOKS_PATH, PUBLIC_V1_WEBHOOKS_PROBE } from '@/api/lib/publicV1Webhooks';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const start = Date.now();
  if (req.method === 'OPTIONS') {
    return optionsResponsePublic(req, PUBLIC_V1_WEBHOOKS_PROBE.methods.join(', '), 'Content-Type, Authorization, X-API-Key');
  }

  const auth = await requirePublicApiKey(req);
  if (auth instanceof Response) {
    await recordPublicApiUsage({
      apiKeyId: null,
      userId: null,
      method: req.method,
      path: PUBLIC_V1_WEBHOOKS_PROBE.path,
      status: auth.status,
      latencyMs: Date.now() - start,
    });
    return auth;
  }

  const d = decideRateLimit({
    req,
    bucket: PUBLIC_V1_WEBHOOKS_PROBE.rateLimitBucket,
    keyPart: auth.apiKeyId,
    limit: PUBLIC_V1_WEBHOOKS_PROBE.rateLimit,
    windowSeconds: PUBLIC_V1_WEBHOOKS_PROBE.rateWindowSeconds,
  });
  if (!d.ok) {
    await recordPublicApiUsage({
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      method: req.method,
      path: PUBLIC_V1_WEBHOOKS_PROBE.path,
      status: 429,
      latencyMs: Date.now() - start,
    });
    return rateLimitedResponsePublic(req, d);
  }

  if (req.method === 'GET') {
    const items = await listWebhookEndpoints(auth.userId);
    const status = 200;
    await recordPublicApiUsage({
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      method: req.method,
      path: PUBLIC_V1_WEBHOOKS_PROBE.path,
      status,
      latencyMs: Date.now() - start,
    });
    return jsonResponsePublic(req, buildPublicV1WebhooksListBody(items), status, rateLimitHeaders(d));
  }

  if (req.method === 'POST') {
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      await recordPublicApiUsage({
        apiKeyId: auth.apiKeyId,
        userId: auth.userId,
        method: req.method,
        path: PUBLIC_V1_WEBHOOKS_PROBE.path,
        status: 400,
        latencyMs: Date.now() - start,
      });
      return errorResponsePublic(req, 400, 'invalid_request', 'Invalid JSON body');
    }
    const parsed = publicV1WebhookCreateSchema.safeParse(json);
    if (!parsed.success) {
      await recordPublicApiUsage({
        apiKeyId: auth.apiKeyId,
        userId: auth.userId,
        method: req.method,
        path: PUBLIC_V1_WEBHOOKS_PROBE.path,
        status: 400,
        latencyMs: Date.now() - start,
      });
      return errorResponsePublic(req, 400, 'invalid_request', 'Invalid request', parsed.error.flatten());
    }
    const created = await createWebhookEndpoint({
      userId: auth.userId,
      url: parsed.data.url,
      events: parsed.data.events,
      enabled: parsed.data.enabled,
    });
    if (!created) {
      await recordPublicApiUsage({
        apiKeyId: auth.apiKeyId,
        userId: auth.userId,
        method: req.method,
        path: PUBLIC_V1_WEBHOOKS_PROBE.path,
        status: 501,
        latencyMs: Date.now() - start,
      });
      return errorResponsePublic(req, 501, PUBLIC_V1_WEBHOOKS_PROBE.notConfiguredCode, PUBLIC_V1_WEBHOOKS_PROBE.notConfiguredMessage);
    }
    const status = 201;
    await recordPublicApiUsage({
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      method: req.method,
      path: PUBLIC_V1_WEBHOOKS_PROBE.path,
      status,
      latencyMs: Date.now() - start,
    });
    return jsonResponsePublic(req, buildPublicV1WebhookCreateBody(created.endpoint, created.secret), status, rateLimitHeaders(d));
  }

  if (req.method === 'DELETE') {
    const url = new URL(req.url);
    const id = (url.searchParams.get('id') ?? '').trim();
    if (!id) return errorResponsePublic(req, 400, 'invalid_request', 'Missing id');
    const ok = await deleteWebhookEndpoint(auth.userId, id);
    if (!ok) return errorResponsePublic(req, 404, 'not_found', 'Webhook endpoint not found');
    const status = 204;
    await recordPublicApiUsage({
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      method: req.method,
      path: PUBLIC_V1_WEBHOOKS_PROBE.path,
      status,
      latencyMs: Date.now() - start,
    });
    return new Response(null, {
      status,
      headers: { 'Access-Control-Allow-Origin': allowedOriginFromReq(req), Vary: 'Origin', ...rateLimitHeaders(d) },
    });
  }

  await recordPublicApiUsage({
    apiKeyId: auth.apiKeyId,
    userId: auth.userId,
    method: req.method,
    path: PUBLIC_V1_WEBHOOKS_PROBE.path,
    status: 405,
    latencyMs: Date.now() - start,
  });
  return errorResponsePublic(req, 405, 'invalid_request', 'Method not allowed');
}