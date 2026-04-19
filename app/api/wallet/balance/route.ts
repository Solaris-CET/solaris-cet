import { getAllowedOrigin } from '../../lib/cors';
import { tonAddressSchema } from '../../lib/validation';
import { fetchToncenterAddressBalance, getToncenterRpcUrl, withToncenterApiKey } from '../../lib/toncenter';

export const config = { runtime: 'edge' };

function jsonResponse(body: unknown, allowedOrigin: string, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Vary': 'Origin',
      'Cache-Control': 'no-store',
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
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
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

  try {
    const base = getToncenterRpcUrl();
    const withKey = withToncenterApiKey(base);
    let tonBalanceNano: string | null = await fetchToncenterAddressBalance(withKey, address, {
      timeoutMs: 4500,
    });
    if (tonBalanceNano == null && withKey.toString() !== base.toString()) {
      tonBalanceNano = await fetchToncenterAddressBalance(base, address, { timeoutMs: 4500 });
    }

    if (tonBalanceNano == null) {
      return jsonResponse({ ok: false, address, error: 'unavailable', cetBalanceNano: null }, allowedOrigin, 200);
    }

    return jsonResponse(
      {
        ok: true,
        address,
        tonBalanceNano,
        cetBalanceNano: null,
      },
      allowedOrigin,
      200,
    );
  } catch {
    return jsonResponse({ ok: false, address, error: 'unavailable', cetBalanceNano: null }, allowedOrigin, 200);
  }
}
