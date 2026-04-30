export const config = { runtime: 'nodejs' };

import { getAllowedOrigin } from '../../lib/cors';
import { fetchTonapiJson, parseTonNetwork } from '../../lib/tonapi';
import { fetchToncenterAddressBalance, getToncenterRpcUrl, withToncenterApiKey } from '../../lib/toncenter';
import { tonAddressSchema } from '../../lib/validation';

const CET_JETTON_MASTER_ADDRESS_MAINNET = 'EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX';

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
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
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
  const network = parseTonNetwork(url.searchParams.get('network'));
  const parsed = tonAddressSchema.safeParse(addressRaw);
  if (!parsed.success) {
    return jsonResponse({ ok: false, error: 'Invalid address' }, allowedOrigin, 400);
  }
  const address = parsed.data.toString();

  const cetMaster = (process.env.CET_JETTON_MASTER_ADDRESS ?? '').trim() || CET_JETTON_MASTER_ADDRESS_MAINNET;

  const tonapiAccount = await fetchTonapiJson<{ balance?: unknown }>(
    network,
    `/v2/accounts/${encodeURIComponent(address)}`,
    { timeoutMs: 4500 },
  );

  const tonapiJettons = await fetchTonapiJson<{ balances?: unknown }>(
    network,
    `/v2/accounts/${encodeURIComponent(address)}/jettons`,
    { timeoutMs: 4500 },
  );

  const tonBalanceNanoFromTonapi = (() => {
    if (!tonapiAccount.ok) return null;
    const bal = tonapiAccount.data.balance;
    if (typeof bal === 'string' || typeof bal === 'number') return String(bal);
    return null;
  })();

  const cetBalanceNanoFromTonapi = (() => {
    if (!tonapiJettons.ok) return null;
    const raw = tonapiJettons.data.balances;
    if (!Array.isArray(raw)) return null;
    for (const item of raw) {
      if (!item || typeof item !== 'object') continue;
      const obj = item as Record<string, unknown>;
      const jetton = obj.jetton;
      const jettonAddr =
        jetton && typeof jetton === 'object' && 'address' in jetton && typeof (jetton as { address?: unknown }).address === 'string'
          ? (jetton as { address: string }).address
          : '';
      if (!jettonAddr) continue;
      if (jettonAddr !== cetMaster) continue;
      const bal = obj.balance;
      if (typeof bal === 'string' || typeof bal === 'number') return String(bal);
      return null;
    }
    return null;
  })();

  if (tonBalanceNanoFromTonapi != null || cetBalanceNanoFromTonapi != null) {
    return jsonResponse(
      {
        ok: true,
        address,
        tonBalanceNano: tonBalanceNanoFromTonapi,
        cetBalanceNano: cetBalanceNanoFromTonapi,
        source: 'tonapi',
        network,
      },
      allowedOrigin,
      200,
    );
  }

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
        source: 'toncenter',
        network,
      },
      allowedOrigin,
      200,
    );
  } catch {
    return jsonResponse({ ok: false, address, error: 'unavailable', cetBalanceNano: null }, allowedOrigin, 200);
  }
}
