import { BRIDGE_SIM_LIMITS } from '@/lib/bridgeMath';

export const BRIDGE_SIMULATE_PATH = '/api/bridge/simulate';
export const BRIDGE_SIMULATE_METHODS = 'GET, POST, OPTIONS';

export const BRIDGE_SIMULATE_PROBE = {
  path: BRIDGE_SIMULATE_PATH,
  methods: ['GET', 'POST', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  listLimit: 100,
  limits: BRIDGE_SIM_LIMITS,
  invalidDirectionError: 'Invalid direction' as const,
  invalidAmountError: 'Invalid amount' as const,
  amountOutOfBoundsError: 'Amount out of bounds' as const,
  amountTooSmallError: 'Amount too small after fee' as const,
  invalidJsonError: 'Invalid JSON' as const,
};

export type BridgeDirection = 'wrap' | 'unwrap';
export type BridgeChain = 'TON' | 'BSC_TESTNET';

export type BridgeMeta = {
  kind: 'bridge_sim';
  version: 1;
  asset: 'CET';
  direction: BridgeDirection;
  fromChain: BridgeChain;
  toChain: BridgeChain;
  tonAddress: string;
  evmAddress: string | null;
  amountMicro: string;
  feeMicro: string;
  netMicro: string;
  srcTxHash: string | null;
  dstTxHash: string | null;
  sim: {
    createdAt: string;
    startedAt: string | null;
    confirmedAt: string | null;
    etaMs: number;
  };
};

export function parseBridgeDirection(v: unknown): BridgeDirection | null {
  if (v === 'wrap' || v === 'unwrap') return v;
  return null;
}

export function parseBridgeEvmAddress(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s) return null;
  if (!/^0x[a-fA-F0-9]{40}$/.test(s)) return null;
  return s;
}

export function isBridgeMeta(v: unknown): v is BridgeMeta {
  if (!v || typeof v !== 'object') return false;
  const o = v as Partial<BridgeMeta>;
  return o.kind === 'bridge_sim' && o.version === 1 && o.asset === 'CET' && (o.direction === 'wrap' || o.direction === 'unwrap');
}

export function bridgeChainsForDirection(direction: BridgeDirection): { fromChain: BridgeChain; toChain: BridgeChain } {
  return direction === 'wrap'
    ? { fromChain: 'TON', toChain: 'BSC_TESTNET' }
    : { fromChain: 'BSC_TESTNET', toChain: 'TON' };
}

export function nowIso(): string {
  return new Date().toISOString();
}