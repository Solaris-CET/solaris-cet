import { getAllowedOrigin } from '@/api/lib/cors';
import { tonAddressSchema } from '@/api/lib/validation';
import { fetchTonAccountBalances, WALLET_BALANCE_PROBE } from '@/api/lib/walletBalance';

export { WALLET_BALANCE_PATH, WALLET_BALANCE_PROBE } from '@/api/lib/walletBalance';

export const config = { runtime: 'edge' };

function jsonResponse(body: unknown, allowedOrigin: string, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
      'Cache-Control': WALLET_BALANCE_PROBE.cacheControl,
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
        'Access-Control-Allow-Methods': WALLET_BALANCE_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, allowedOrigin, 405);
  }

  const url = new URL(req.url);
  const addressRaw = (url.searchParams.get('address') ?? '').trim();
  const parsed = tonAddressSchema.safeParse(addressRaw);
  if (!parsed.success) {
    return jsonResponse({ ok: false, error: 'Invalid address' }, allowedOrigin, 400);
  }
  const address = parsed.data.toString();

  const result = await fetchTonAccountBalances(address, url.searchParams.get('network'), { includeJettonWallet: false });
  return jsonResponse(result, allowedOrigin, 200);
}