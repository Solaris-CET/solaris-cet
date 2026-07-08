import { requireAuth } from '@/api/lib/auth';
import { CONSOLE_WEBHOOKS_PROBE, consoleWebhookCreateSchema, parseConsoleWebhooksDeleteId } from '@/api/lib/consoleWebhooks';
import { decideRateLimit, rateLimitHeaders } from '@/api/lib/publicApiRateLimit';
import {
  allowedOriginFromReq,
  errorResponsePublic,
  jsonResponsePublic,
  optionsResponsePublic,
  rateLimitedResponsePublic,
} from '../../lib/publicApiResponse';
import { createWebhookEndpoint, deleteWebhookEndpoint, listWebhookEndpoints } from '@/api/lib/publicWebhooksStore';

export { CONSOLE_WEBHOOKS_PATH, CONSOLE_WEBHOOKS_PROBE } from '@/api/lib/consoleWebhooks';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponsePublic(req, CONSOLE_WEBHOOKS_PROBE.methods.join(', '), 'Content-Type, Authorization');
  }

  const auth = await requireAuth(req);
  if ('error' in auth) return errorResponsePublic(req, auth.status, 'unauthorized', auth.error);

  const d = decideRateLimit({
    req,
    bucket: CONSOLE_WEBHOOKS_PROBE.rateLimitBucket,
    keyPart: auth.user.id,
    limit: CONSOLE_WEBHOOKS_PROBE.rateLimit,
    windowSeconds: CONSOLE_WEBHOOKS_PROBE.rateWindowSeconds,
  });
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
      return errorResponsePublic(req, 400, 'invalid_request', CONSOLE_WEBHOOKS_PROBE.invalidJsonError);
    }
    const parsed = consoleWebhookCreateSchema.safeParse(json);
    if (!parsed.success) return errorResponsePublic(req, 400, 'invalid_request', 'Invalid request', parsed.error.flatten());
    const created = await createWebhookEndpoint({
      userId: auth.user.id,
      url: parsed.data.url,
      events: parsed.data.events,
      enabled: parsed.data.enabled,
    });
    if (!created) return errorResponsePublic(req, 501, 'not_configured', CONSOLE_WEBHOOKS_PROBE.notConfiguredError);
    return jsonResponsePublic(req, { endpoint: created.endpoint, secret: created.secret }, 201, rateLimitHeaders(d));
  }

  if (req.method === 'DELETE') {
    const url = new URL(req.url);
    const id = parseConsoleWebhooksDeleteId(url.searchParams);
    if (!id) return errorResponsePublic(req, 400, 'invalid_request', CONSOLE_WEBHOOKS_PROBE.missingIdError);
    const ok = await deleteWebhookEndpoint(auth.user.id, id);
    if (!ok) return errorResponsePublic(req, 404, 'not_found', CONSOLE_WEBHOOKS_PROBE.notFoundError);
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