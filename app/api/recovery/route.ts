import { getAllowedOrigin } from '@/api/lib/cors';
import {
  buildWalletRecoveryResponse,
  parseWalletRecoveryBody,
  WALLET_RECOVERY_PROBE,
} from '../lib/walletRecovery';

export { WALLET_RECOVERY_PATH, WALLET_RECOVERY_PROBE } from '@/api/lib/walletRecovery';

export const config = { runtime: 'edge' };

function jsonResponse(body: unknown, allowedOrigin: string, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
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
        'Access-Control-Allow-Methods': WALLET_RECOVERY_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, allowedOrigin, 405);
  }

  try {
    const body = await req.json();
    const wallet = parseWalletRecoveryBody(body);
    return jsonResponse(buildWalletRecoveryResponse(wallet), allowedOrigin, 200);
  } catch {
    return jsonResponse({ error: WALLET_RECOVERY_PROBE.invalidJsonError }, allowedOrigin, 400);
  }
}