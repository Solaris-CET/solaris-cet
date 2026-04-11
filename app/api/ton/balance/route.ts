export const config = { runtime: 'nodejs' };

import { getAllowedOrigin } from '../../lib/cors';
import { CET_JETTON_MASTER_ADDRESS } from '../../../src/constants/token';
import { getTonClient, parseTonAddress } from '../../lib/ton';
import { JettonMaster, JettonWallet, TonClient } from '@ton/ton';

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
  const addressParam = url.searchParams.get('address') ?? '';
  const includeJetton = ['1', 'true', 'yes'].includes((url.searchParams.get('jetton') ?? '').toLowerCase());
  const address = parseTonAddress(addressParam);
  if (!address) {
    return jsonResponse({ ok: false, error: 'Invalid address' }, allowedOrigin, 400);
  }

  try {
    const client = getTonClient();
    if (!client) {
      return jsonResponse({ ok: false, error: 'TON not configured' }, allowedOrigin, 503);
    }

    const run = async (c: TonClient) => {
      const tonBalanceNano = (await c.getBalance(address)).toString();
      let cetBalanceNano: string | null = null;

      if (includeJetton) {
        try {
          const master = parseTonAddress(CET_JETTON_MASTER_ADDRESS);
          if (master) {
            const openedMaster = c.open(JettonMaster.create(master));
            const jettonWalletAddress = await openedMaster.getWalletAddress(address);
            const openedWallet = c.open(JettonWallet.create(jettonWalletAddress));
            cetBalanceNano = (await openedWallet.getBalance()).toString();
          }
        } catch {
          cetBalanceNano = null;
        }
      }

      return { tonBalanceNano, cetBalanceNano };
    };

    let result: { tonBalanceNano: string; cetBalanceNano: string | null };
    try {
      result = await run(client);
    } catch {
      const endpointRaw = process.env.TONCENTER_RPC_URL?.trim();
      if (!endpointRaw) throw new Error('missing_endpoint');
      const u = new URL(endpointRaw);
      u.searchParams.delete('api_key');
      const fallback = new TonClient({ endpoint: u.toString() });
      result = await run(fallback);
    }

    return jsonResponse(
      {
        ok: true,
        address: address.toString(),
        tonBalanceNano: result.tonBalanceNano,
        cetBalanceNano: result.cetBalanceNano,
        source: 'ton-sdk',
      },
      allowedOrigin,
      200,
    );
  } catch {
    return jsonResponse({ ok: false, error: 'TON request failed' }, allowedOrigin, 502);
  }
}
