import { requirePublicApiKey } from '../../lib/publicApiAuth';
import { recordPublicApiUsage } from '../../lib/publicApiMetrics';
import { decideRateLimit, rateLimitHeaders } from '../../lib/publicApiRateLimit';
import { errorResponsePublic, jsonResponsePublic, optionsResponsePublic, rateLimitedResponsePublic } from '../../lib/publicApiResponse';

export const config = { runtime: 'nodejs' };

function priceFromEnv(): number | null {
  const v = String(process.env.CET_PRICE_USD ?? '').trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default async function handler(req: Request): Promise<Response> {
  const start = Date.now();
  if (req.method === 'OPTIONS') {
    return optionsResponsePublic(req, 'GET, OPTIONS', 'Content-Type, Authorization, X-API-Key');
  }
  if (req.method !== 'GET') return errorResponsePublic(req, 405, 'invalid_request', 'Method not allowed');

  const auth = await requirePublicApiKey(req);
  if (auth instanceof Response) {
    await recordPublicApiUsage({
      apiKeyId: null,
      userId: null,
      method: req.method,
      path: '/api/v1/price',
      status: auth.status,
      latencyMs: Date.now() - start,
    });
    return auth;
  }

  const d = decideRateLimit({ req, bucket: 'public-v1-price', keyPart: auth.apiKeyId, limit: 120, windowSeconds: 60 });
  if (!d.ok) {
    await recordPublicApiUsage({ apiKeyId: auth.apiKeyId, userId: auth.userId, method: req.method, path: '/api/v1/price', status: 429, latencyMs: Date.now() - start });
    return rateLimitedResponsePublic(req, d);
  }

  const priceUsd = priceFromEnv() ?? 0;
  const body = {
    version: 'v1',
    asset: 'CET',
    priceUsd,
    updatedAt: new Date().toISOString(),
    source: priceUsd ? 'env' : 'fallback',
  };
  const status = 200;
  await recordPublicApiUsage({ apiKeyId: auth.apiKeyId, userId: auth.userId, method: req.method, path: '/api/v1/price', status, latencyMs: Date.now() - start });
  return jsonResponsePublic(req, body, status, rateLimitHeaders(d));
}

