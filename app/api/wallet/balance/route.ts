import { getAllowedOrigin } from '../../lib/cors';

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

function isLikelyTonAddress(v: string) {
  const s = v.trim();
  if (s.length < 20 || s.length > 80) return false;
  return /^[A-Za-z0-9_\-+=]+$/.test(s);
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
  const address = (url.searchParams.get('address') ?? '').trim();
  if (!address || !isLikelyTonAddress(address)) {
    return jsonResponse({ ok: false, error: 'Invalid address' }, allowedOrigin, 400);
  }

  const rpc = process.env.TONCENTER_RPC_URL?.trim() || 'https://toncenter.com/api/v2/jsonRPC';
  const apiKey = process.env.TONCENTER_API_KEY?.trim();
  const rpcUrl = new URL(rpc);
  if (apiKey) rpcUrl.searchParams.set('api_key', apiKey);

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 4500);
  try {
    const res = await fetch(rpcUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: '1',
        jsonrpc: '2.0',
        method: 'getAddressBalance',
        params: { address },
      }),
      signal: controller.signal,
    });

    const json = (await res.json()) as { ok?: boolean; result?: string; error?: unknown };
    if (!res.ok || json?.result == null) {
      return jsonResponse(
        { ok: false, address, error: 'unavailable', cetBalanceNano: null },
        allowedOrigin,
        200,
      );
    }

    return jsonResponse(
      {
        ok: true,
        address,
        tonBalanceNano: String(json.result),
        cetBalanceNano: null,
      },
      allowedOrigin,
      200,
    );
  } catch {
    return jsonResponse({ ok: false, address, error: 'unavailable', cetBalanceNano: null }, allowedOrigin, 200);
  } finally {
    clearTimeout(id);
  }
}

