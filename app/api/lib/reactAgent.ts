import { CET_CONTRACT_ADDRESS } from '@/lib/cetContract';

export const REACT_AGENT_PATH = '/api/react';
export const REACT_AGENT_METHODS = 'POST, OPTIONS';

export const REACT_AGENT_PROBE = {
  path: REACT_AGENT_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  invalidJsonError: 'Invalid JSON body' as const,
};

export type ReasoningTraceStep = {
  step: number;
  reasoning: string;
  action: string;
  result: string;
  verified: boolean;
};

export function isLikelyTonAddress(v: unknown): v is string {
  if (typeof v !== 'string') return false;
  const s = v.trim();
  if (s.length < 20 || s.length > 80) return false;
  return /^[A-Za-z0-9_\-+=]+$/.test(s);
}

export function parseReactAgentBody(body: unknown): { query: string; walletAddress: string | null } {
  if (!body || typeof body !== 'object') return { query: '', walletAddress: null };
  const rec = body as { query?: unknown; walletAddress?: unknown };
  const query = typeof rec.query === 'string' ? rec.query.trim() : '';
  const walletAddress = isLikelyTonAddress(rec.walletAddress) ? rec.walletAddress.trim() : null;
  return { query, walletAddress };
}

export function buildReactAgentTrace(walletAddress: string | null, contractAddress = CET_CONTRACT_ADDRESS): ReasoningTraceStep[] {
  return [
    {
      step: 1,
      reasoning: 'Identify whether the user intent needs wallet context.',
      action: 'checkWalletConnected()',
      result: walletAddress ? `Wallet connected: ${walletAddress}` : 'Wallet not connected',
      verified: walletAddress !== null,
    },
    {
      step: 2,
      reasoning: 'Select data source: on-chain balance requires a wallet address and an indexer/RPC.',
      action: `resolveBalanceSource(${walletAddress ? 'wallet' : 'none'})`,
      result: walletAddress
        ? `Balance lookup: unavailable on this host (no TON RPC configured). Contract: ${contractAddress}`
        : 'Ask user to connect a TON wallet to check balances.',
      verified: false,
    },
  ];
}

export function buildReactAgentFinalAnswer(walletAddress: string | null): string {
  return walletAddress === null
    ? 'Connect your TON wallet to check your CET balance.'
    : 'Wallet detected. Live CET balance lookup requires a TON RPC/indexer on this host.';
}