import { z } from 'zod';

import { requirePublicApiKey } from '../../lib/publicApiAuth';
import { recordPublicApiUsage } from '../../lib/publicApiMetrics';
import { decideRateLimit, rateLimitHeaders } from '../../lib/publicApiRateLimit';
import {
  allowedOriginFromReq,
  errorResponsePublic,
  jsonResponsePublic,
  optionsResponsePublic,
  rateLimitedResponsePublic,
} from '../../lib/publicApiResponse';
import { createWebhookEndpoint, deleteWebhookEndpoint, listWebhookEndpoints } from '../../lib/publicWebhooksStore';

export const config = { runtime: 'nodejs' };

const createSchema = z.object({
  url: z.string().trim().url().max(800),
  events: z.array(z.string().trim().min(1).max(80)).max(50).default([]),
  enabled: z.boolean().optional().default(true),
});

export default async function handler(req: Request): Promise<Response> {
  const start = Date.now();
  if (req.method === 'OPTIONS') {
    return optionsResponsePublic(req, 'GET, POST, DELETE, OPTIONS', 'Content-Type, Authorization, X-API-Key');
  }

  const auth = await requirePublicApiKey(req);
  if (auth instanceof Response) {
    await recordPublicApiUsage({ apiKeyId: null, userId: null, method: req.method, path: '/api/v1/webhooks', status: auth.status, latencyMs: Date.now() - start });
    return auth;
  }

  const d = decideRateLimit({ req, bucket: 'public-v1-webhooks', keyPart: auth.apiKeyId, limit: 60, windowSeconds: 60 });
  if (!d.ok) {
    await recordPublicApiUsage({ apiKeyId: auth.apiKeyId, userId: auth.userId, method: req.method, path: '/api/v1/webhooks', status: 429, latencyMs: Date.now() - start });
    return rateLimitedResponsePublic(req, d);
  }

  if (req.method === 'GET') {
    const items = await listWebhookEndpoints(auth.userId);
    const status = 200;
    await recordPublicApiUsage({ apiKeyId: auth.apiKeyId, userId: auth.userId, method: req.method, path: '/api/v1/webhooks', status, latencyMs: Date.now() - start });
    return jsonResponsePublic(req, { version: 'v1', items }, status, rateLimitHeaders(d));
  }

  if (req.method === 'POST') {
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      await recordPublicApiUsage({ apiKeyId: auth.apiKeyId, userId: auth.userId, method: req.method, path: '/api/v1/webhooks', status: 400, latencyMs: Date.now() - start });
      return errorResponsePublic(req, 400, 'invalid_request', 'Invalid JSON body');
    }
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      await recordPublicApiUsage({ apiKeyId: auth.apiKeyId, userId: auth.userId, method: req.method, path: '/api/v1/webhooks', status: 400, latencyMs: Date.now() - start });
      return errorResponsePublic(req, 400, 'invalid_request', 'Invalid request', parsed.error.flatten());
    }
    const created = await createWebhookEndpoint({ userId: auth.userId, url: parsed.data.url, events: parsed.data.events, enabled: parsed.data.enabled });
    if (!created) {
      await recordPublicApiUsage({ apiKeyId: auth.apiKeyId, userId: auth.userId, method: req.method, path: '/api/v1/webhooks', status: 501, latencyMs: Date.now() - start });
      return errorResponsePublic(req, 501, 'not_configured', 'Webhook secrets are not configured');
    }
    const status = 201;
    await recordPublicApiUsage({ apiKeyId: auth.apiKeyId, userId: auth.userId, method: req.method, path: '/api/v1/webhooks', status, latencyMs: Date.now() - start });
    return jsonResponsePublic(req, { version: 'v1', endpoint: created.endpoint, secret: created.secret }, status, rateLimitHeaders(d));
  }

  if (req.method === 'DELETE') {
    const url = new URL(req.url);
    const id = (url.searchParams.get('id') ?? '').trim();
    if (!id) return errorResponsePublic(req, 400, 'invalid_request', 'Missing id');
    const ok = await deleteWebhookEndpoint(auth.userId, id);
    if (!ok) return errorResponsePublic(req, 404, 'not_found', 'Webhook endpoint not found');
    const status = 204;
    await recordPublicApiUsage({ apiKeyId: auth.apiKeyId, userId: auth.userId, method: req.method, path: '/api/v1/webhooks', status, latencyMs: Date.now() - start });
    return new Response(null, {
      status,
      headers: { 'Access-Control-Allow-Origin': allowedOriginFromReq(req), Vary: 'Origin', ...rateLimitHeaders(d) },
    });
  }

  await recordPublicApiUsage({ apiKeyId: auth.apiKeyId, userId: auth.userId, method: req.method, path: '/api/v1/webhooks', status: 405, latencyMs: Date.now() - start });
  return errorResponsePublic(req, 405, 'invalid_request', 'Method not allowed');
}
