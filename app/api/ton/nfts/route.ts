import { getAllowedOrigin } from '@/api/lib/cors';
import { withRateLimit } from '@/api/lib/rateLimit';
import { fetchTonNftsForOwner, TON_NFTS_PROBE } from '@/api/lib/tonNfts';
import { tonAddressSchema } from '@/api/lib/validation';

export { TON_NFTS_PATH, TON_NFTS_PROBE } from '@/api/lib/tonNfts';

export const config = { runtime: 'edge' };

function jsonResponse(body: unknown, allowedOrigin: string, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
      'Cache-Control': TON_NFTS_PROBE.cacheControl,
    },
  });
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': TON_NFTS_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, allowedOrigin, 405);
  }

  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: TON_NFTS_PROBE.rateLimitKey,
    limit: TON_NFTS_PROBE.rateLimit,
    windowSeconds: TON_NFTS_PROBE.rateWindowSeconds,
  });
  if (limited) return limited;

  const url = new URL(req.url);
  const ownerRaw = (url.searchParams.get('owner') ?? '').trim();
  const parsed = tonAddressSchema.safeParse(ownerRaw);
  if (!parsed.success) {
    return jsonResponse({ ok: false, error: 'Invalid address' }, allowedOrigin, 400);
  }
  const owner = parsed.data.toString();

  const result = await fetchTonNftsForOwner(owner, url.searchParams.get('network'));
  if (!result.ok) {
    return jsonResponse({ ok: false, error: 'unavailable' }, allowedOrigin, 200);
  }

  return jsonResponse({ ok: true, owner: result.owner, network: result.network, items: result.items }, allowedOrigin, 200);
}