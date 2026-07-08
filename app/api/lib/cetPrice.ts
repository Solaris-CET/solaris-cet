import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { fetchTonPriceUsd } from './tonPrice';

export const CET_PRICE_PATH = '/api/price/cet';
export const CET_PRICE_METHODS = 'GET, OPTIONS';

export const CET_PRICE_PROBE = {
  path: CET_PRICE_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  symbol: 'CET' as const,
  stateRelativePath: 'public/api/state.json' as const,
  unavailableStatus: 503,
  unavailableError: 'Unavailable' as const,
};

export type CetChainState = {
  pool?: { priceTonPerCet?: string | null };
  updatedAt?: string;
};

export type CetPriceSnapshot = {
  symbol: typeof CET_PRICE_PROBE.symbol;
  priceTonPerCet: string | null;
  updatedAt: string | null;
};

export function cetPriceStateFilePath(cwd = process.cwd()): string {
  return join(cwd, CET_PRICE_PROBE.stateRelativePath);
}

export function parseCetPriceState(raw: unknown): CetPriceSnapshot {
  const parsed = raw && typeof raw === 'object' ? (raw as CetChainState) : {};
  const priceTonPerCet = typeof parsed.pool?.priceTonPerCet === 'string' ? parsed.pool.priceTonPerCet : null;
  const updatedAt = typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null;
  return { symbol: CET_PRICE_PROBE.symbol, priceTonPerCet, updatedAt };
}

export async function loadCetPriceSnapshot(cwd = process.cwd()): Promise<CetPriceSnapshot> {
  const raw = await readFile(cetPriceStateFilePath(cwd), 'utf8');
  return parseCetPriceState(JSON.parse(raw) as unknown);
}

export async function fetchCetPriceUsd(): Promise<{ priceUsd: number; source: 'state' | 'fallback' }> {
  try {
    const [snapshot, ton] = await Promise.all([loadCetPriceSnapshot(), fetchTonPriceUsd()]);
    const priceTonPerCet = Number(snapshot.priceTonPerCet);
    if (!Number.isFinite(priceTonPerCet) || priceTonPerCet <= 0 || !ton.priceUsd) {
      return { priceUsd: 0, source: 'fallback' };
    }
    return { priceUsd: priceTonPerCet * ton.priceUsd, source: 'state' };
  } catch {
    return { priceUsd: 0, source: 'fallback' };
  }
}