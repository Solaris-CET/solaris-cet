import { z } from 'zod';

import { requirePublicApiKey } from '../../lib/publicApiAuth';
import { recordPublicApiUsage } from '../../lib/publicApiMetrics';
import { decideRateLimit, rateLimitHeaders } from '../../lib/publicApiRateLimit';
import { errorResponsePublic, jsonResponsePublic, optionsResponsePublic, rateLimitedResponsePublic } from '../../lib/publicApiResponse';
import { createTransaction, listTransactions } from '../../lib/publicTransactionsStore';
import { emitWebhookEvent } from '../../lib/publicWebhooksStore';

export const config = { runtime: 'nodejs' };

const createSchema = z.object({
  from: z.string().trim().min(1).max(120).optional().nullable(),
  to: z.string().trim().min(1).max(120).optional().nullable(),
  amount: z.string().trim().min(1).max(80),
  txHash: z.string().trim().min(1).max(160).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export default async function handler(req: Request): Promise<Response> {
  const start = Date.now();
  if (req.method === 'OPTIONS') {
    return optionsResponsePublic(req, 'GET, POST, OPTIONS', 'Content-Type, Authorization, X-API-Key');
  }

  const auth = await requirePublicApiKey(req);
  if (auth instanceof Response) {
    await recordPublicApiUsage({ apiKeyId: null, userId: null, method: req.method, path: '/api/v2/transactions', status: auth.status, latencyMs: Date.now() - start });
    return auth;
  }

  const d = decideRateLimit({ req, bucket: 'public-v2-transactions', keyPart: auth.apiKeyId, limit: req.method === 'POST' ? 60 : 240, windowSeconds: 60 });
  if (!d.ok) {
    await recordPublicApiUsage({ apiKeyId: auth.apiKeyId, userId: auth.userId, method: req.method, path: '/api/v2/transactions', status: 429, latencyMs: Date.now() - start });
    return rateLimitedResponsePublic(req, d);
  }

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get('limit') ?? '50');
    const cursor = url.searchParams.get('cursor');
    const { items, nextCursor } = listTransactions({ limit, cursor });
    const body = { version: 'v2', data: items, page: { nextCursor } };
    const status = 200;
    await recordPublicApiUsage({ apiKeyId: auth.apiKeyId, userId: auth.userId, method: req.method, path: '/api/v2/transactions', status, latencyMs: Date.now() - start });
    return jsonResponsePublic(req, body, status, rateLimitHeaders(d));
  }

  if (req.method === 'POST') {
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      await recordPublicApiUsage({ apiKeyId: auth.apiKeyId, userId: auth.userId, method: req.method, path: '/api/v2/transactions', status: 400, latencyMs: Date.now() - start });
      return errorResponsePublic(req, 400, 'invalid_request', 'Invalid JSON body');
    }
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      await recordPublicApiUsage({ apiKeyId: auth.apiKeyId, userId: auth.userId, method: req.method, path: '/api/v2/transactions', status: 400, latencyMs: Date.now() - start });
      return errorResponsePublic(req, 400, 'invalid_request', 'Invalid request', parsed.error.flatten());
    }
    const tx = createTransaction(parsed.data);
    void emitWebhookEvent(auth.userId, 'transaction.created', tx);
    const status = 201;
    await recordPublicApiUsage({ apiKeyId: auth.apiKeyId, userId: auth.userId, method: req.method, path: '/api/v2/transactions', status, latencyMs: Date.now() - start });
    return jsonResponsePublic(req, { version: 'v2', transaction: tx, received: { metadata: parsed.data.metadata ?? null } }, status, rateLimitHeaders(d));
  }

  await recordPublicApiUsage({ apiKeyId: auth.apiKeyId, userId: auth.userId, method: req.method, path: '/api/v2/transactions', status: 405, latencyMs: Date.now() - start });
  return errorResponsePublic(req, 405, 'invalid_request', 'Method not allowed');
}
