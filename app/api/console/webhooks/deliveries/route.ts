import { requireAuth } from '../../../lib/auth';
import { decideRateLimit, rateLimitHeaders } from '../../../lib/publicApiRateLimit';
import { errorResponsePublic, jsonResponsePublic, optionsResponsePublic, rateLimitedResponsePublic } from '../../../lib/publicApiResponse';
import { listWebhookDeliveries } from '../../../lib/publicWebhooksStore';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponsePublic(req, 'GET, OPTIONS', 'Content-Type, Authorization');
  }
  if (req.method !== 'GET') return errorResponsePublic(req, 405, 'invalid_request', 'Method not allowed');

  const auth = await requireAuth(req);
  if ('error' in auth) return errorResponsePublic(req, auth.status, 'unauthorized', auth.error);

  const d = decideRateLimit({ req, bucket: 'console-webhook-deliveries', keyPart: auth.user.id, limit: 120, windowSeconds: 60 });
  if (!d.ok) return rateLimitedResponsePublic(req, d);

  const url = new URL(req.url);
  const endpointId = (url.searchParams.get('endpointId') ?? '').trim();
  if (!endpointId) return errorResponsePublic(req, 400, 'invalid_request', 'Missing endpointId');
  const limit = Number(url.searchParams.get('limit') ?? '50');
  const items = await listWebhookDeliveries(auth.user.id, endpointId, limit);
  return jsonResponsePublic(req, { items }, 200, rateLimitHeaders(d));
}

