export const config = { runtime: 'nodejs' };

import { getAllowedOrigin } from '@/api/lib/cors';
import { fetchTonAccountBalances, TON_BALANCE_PROBE } from '@/api/lib/tonBalance';
import { tonAddressSchema } from '@/api/lib/validation';

export { TON_BALANCE_PATH, TON_BALANCE_PROBE } from '@/api/lib/tonBalance';

function jsonResponse(body: unknown, allowedOrigin: string, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
      'Cache-Control': TON_BALANCE_PROBE.cacheControl,
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
        'Access-Control-Allow-Methods': TON_BALANCE_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, allowedOrigin, 405);
  }

  const url = new URL(req.url);
  const addressRaw = (url.searchParams.get('address') ?? '').trim();
  const parsed = tonAddressSchema.safeParse(addressRaw);
  if (!parsed.success) {
    return jsonResponse({ ok: false, error: 'Invalid address' }, allowedOrigin, 400);
  }
  const address = parsed.data.toString();

  const result = await fetchTonAccountBalances(address, url.searchParams.get('network'), { includeJettonWallet: true });
  return jsonResponse(result, allowedOrigin, 200);
}