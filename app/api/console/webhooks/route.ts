import { z } from 'zod';

import { requireAuth } from '../../lib/auth';
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
  if (req.method === 'OPTIONS') {
    return optionsResponsePublic(req, 'GET, POST, DELETE, OPTIONS', 'Content-Type, Authorization');
  }

  const auth = await requireAuth(req);
  if ('error' in auth) return errorResponsePublic(req, auth.status, 'unauthorized', auth.error);

  const d = decideRateLimit({ req, bucket: 'console-webhooks', keyPart: auth.user.id, limit: 120, windowSeconds: 60 });
  if (!d.ok) return rateLimitedResponsePublic(req, d);

  if (req.method === 'GET') {
    const items = await listWebhookEndpoints(auth.user.id);
    return jsonResponsePublic(req, { items }, 200, rateLimitHeaders(d));
  }

  if (req.method === 'POST') {
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return errorResponsePublic(req, 400, 'invalid_request', 'Invalid JSON body');
    }
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) return errorResponsePublic(req, 400, 'invalid_request', 'Invalid request', parsed.error.flatten());
    const created = await createWebhookEndpoint({ userId: auth.user.id, url: parsed.data.url, events: parsed.data.events, enabled: parsed.data.enabled });
    if (!created) return errorResponsePublic(req, 501, 'not_configured', 'Webhook secrets are not configured');
    return jsonResponsePublic(req, { endpoint: created.endpoint, secret: created.secret }, 201, rateLimitHeaders(d));
  }

  if (req.method === 'DELETE') {
    const url = new URL(req.url);
    const id = (url.searchParams.get('id') ?? '').trim();
    if (!id) return errorResponsePublic(req, 400, 'invalid_request', 'Missing id');
    const ok = await deleteWebhookEndpoint(auth.user.id, id);
    if (!ok) return errorResponsePublic(req, 404, 'not_found', 'Webhook endpoint not found');
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOriginFromReq(req),
        Vary: 'Origin',
        'Cache-Control': 'no-store',
        ...rateLimitHeaders(d),
      },
    });
  }

  return errorResponsePublic(req, 405, 'invalid_request', 'Method not allowed');
}

