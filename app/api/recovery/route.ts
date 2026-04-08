import { getAllowedOrigin } from '../lib/cors';

export const config = { runtime: 'edge' };

function isLikelyTonAddress(v: unknown): v is string {
  if (typeof v !== 'string') return false;
  const s = v.trim();
  if (s.length < 20 || s.length > 80) return false;
  return /^[A-Za-z0-9_\-+=]+$/.test(s);
}

function jsonResponse(body: unknown, allowedOrigin: string, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Vary': 'Origin',
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
      },
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, allowedOrigin, 405);
  }

  try {
    const body = (await req.json()) as { wallet?: unknown };
    const wallet = isLikelyTonAddress(body.wallet) ? body.wallet.trim() : null;

    const recoverySteps = [
      { step: 1, action: 'Confirm you have your seed phrase or a secure backup.' },
      { step: 2, action: 'Verify the wallet address format and network (TON mainnet).' },
      { step: 3, action: 'If you cannot access the wallet, recover using seed phrase in Tonkeeper.' },
      { step: 4, action: 'If the address is known, review balance + history in a TON explorer.' },
    ];

    if (!wallet) {
      return jsonResponse(
        {
          message: 'Provide a TON wallet address to continue.',
          recoverySteps,
          options: ['Seed phrase', 'Backup file', 'Contact support'],
        },
        allowedOrigin,
        200,
      );
    }

    return jsonResponse(
      {
        wallet,
        exists: 'unknown',
        message: 'Wallet address received. This endpoint provides guided recovery. On-chain validation requires a TON RPC/indexer on this host.',
        recoverySteps,
        nextActions: ['Open in Tonkeeper', 'Open in a TON explorer', 'Re-check backup'],
      },
      allowedOrigin,
      200,
    );
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, allowedOrigin, 400);
  }
}

