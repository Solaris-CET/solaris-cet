import { requireAuth } from '@/api/lib/auth';
import {
  CONSOLE_WEBHOOK_DELIVERIES_PROBE,
  parseConsoleWebhookDeliveriesEndpointId,
  parseConsoleWebhookDeliveriesLimit,
} from '../../../lib/consoleWebhookDeliveries';
import { decideRateLimit, rateLimitHeaders } from '@/api/lib/publicApiRateLimit';
import { errorResponsePublic, jsonResponsePublic, optionsResponsePublic, rateLimitedResponsePublic } from '@/api/lib/publicApiResponse';
import { listWebhookDeliveries } from '@/api/lib/publicWebhooksStore';

export { CONSOLE_WEBHOOK_DELIVERIES_PATH, CONSOLE_WEBHOOK_DELIVERIES_PROBE } from '@/api/lib/consoleWebhookDeliveries';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponsePublic(req, CONSOLE_WEBHOOK_DELIVERIES_PROBE.methods.join(', '), 'Content-Type, Authorization');
  }
  if (req.method !== 'GET') return errorResponsePublic(req, 405, 'invalid_request', 'Method not allowed');

  const auth = await requireAuth(req);
  if ('error' in auth) return errorResponsePublic(req, auth.status, 'unauthorized', auth.error);

  const d = decideRateLimit({
    req,
    bucket: CONSOLE_WEBHOOK_DELIVERIES_PROBE.rateLimitBucket,
    keyPart: auth.user.id,
    limit: CONSOLE_WEBHOOK_DELIVERIES_PROBE.rateLimit,
    windowSeconds: CONSOLE_WEBHOOK_DELIVERIES_PROBE.rateWindowSeconds,
  });
  if (!d.ok) return rateLimitedResponsePublic(req, d);

  const url = new URL(req.url);
  const endpointId = parseConsoleWebhookDeliveriesEndpointId(url.searchParams);
  if (!endpointId) return errorResponsePublic(req, 400, 'invalid_request', CONSOLE_WEBHOOK_DELIVERIES_PROBE.missingEndpointIdError);
  const limit = parseConsoleWebhookDeliveriesLimit(url.searchParams);
  const items = await listWebhookDeliveries(auth.user.id, endpointId, limit);
  return jsonResponsePublic(req, { items }, 200, rateLimitHeaders(d));
}