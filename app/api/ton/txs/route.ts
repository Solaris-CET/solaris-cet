import { getAllowedOrigin } from '@/api/lib/cors';
import { withRateLimit } from '@/api/lib/rateLimit';
import { fetchTonTxEvents, parseTonTxsLimit, resolveTonTxsBeforeLt, TON_TXS_PROBE } from '@/api/lib/tonTxs';
import { tonAddressSchema } from '@/api/lib/validation';

export { TON_TXS_PATH, TON_TXS_PROBE } from '@/api/lib/tonTxs';

export const config = { runtime: 'edge' };

function jsonResponse(body: unknown, allowedOrigin: string, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
      'Cache-Control': TON_TXS_PROBE.cacheControl,
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
        'Access-Control-Allow-Methods': TON_TXS_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, allowedOrigin, 405);
  }

  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: TON_TXS_PROBE.rateLimitKey,
    limit: TON_TXS_PROBE.rateLimit,
    windowSeconds: TON_TXS_PROBE.rateWindowSeconds,
  });
  if (limited) return limited;

  const url = new URL(req.url);
  const addressRaw = (url.searchParams.get('address') ?? '').trim();
  const type = (url.searchParams.get('type') ?? 'all').trim();
  const parsed = tonAddressSchema.safeParse(addressRaw);
  if (!parsed.success) {
    return jsonResponse({ ok: false, error: 'Invalid address' }, allowedOrigin, 400);
  }
  const address = parsed.data.toString();

  const limit = parseTonTxsLimit((url.searchParams.get('limit') ?? '').trim());
  const beforeLt = resolveTonTxsBeforeLt(url);

  const result = await fetchTonTxEvents(address, url.searchParams.get('network'), limit, beforeLt, type);
  if (!result.ok) {
    return jsonResponse({ ok: false, error: 'unavailable' }, allowedOrigin, 200);
  }

  return jsonResponse(
    { ok: true, address: result.address, network: result.network, items: result.items, nextCursor: result.nextCursor },
    allowedOrigin,
    200,
  );
}