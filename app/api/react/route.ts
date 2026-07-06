import { CET_CONTRACT_ADDRESS } from '../../src/lib/cetContract';
import { getAllowedOrigin } from '../lib/cors';

export const config = { runtime: 'edge' };

interface ReasoningTraceStep {
  step: number;
  reasoning: string;
  action: string;
  result: string;
  verified: boolean;
}

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
    const body = (await req.json()) as { query?: unknown; walletAddress?: unknown };
    const query = typeof body.query === 'string' ? body.query.trim() : '';
    const walletAddress = isLikelyTonAddress(body.walletAddress) ? body.walletAddress.trim() : null;

    const trace: ReasoningTraceStep[] = [];

    trace.push({
      step: 1,
      reasoning: 'Identify whether the user intent needs wallet context.',
      action: 'checkWalletConnected()',
      result: walletAddress ? `Wallet connected: ${walletAddress}` : 'Wallet not connected',
      verified: walletAddress !== null,
    });

    trace.push({
      step: 2,
      reasoning: 'Select data source: on-chain balance requires a wallet address and an indexer/RPC.',
      action: `resolveBalanceSource(${walletAddress ? 'wallet' : 'none'})`,
      result: walletAddress
        ? `Balance lookup: unavailable on this host (no TON RPC configured). Contract: ${CET_CONTRACT_ADDRESS}`
        : 'Ask user to connect a TON wallet to check balances.',
      verified: false,
    });

    const finalAnswer =
      walletAddress === null
        ? 'Connect your TON wallet to check your CET balance.'
        : 'Wallet detected. Live CET balance lookup requires a TON RPC/indexer on this host.';

    return jsonResponse(
      {
        query,
        walletAddress,
        trace,
        finalAnswer,
      },
      allowedOrigin,
      200,
    );
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, allowedOrigin, 400);
  }
}

