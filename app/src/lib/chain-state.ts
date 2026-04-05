/**
 * chain-state.ts
 *
 * Typed schema for `public/api/state.json` produced by the TON indexer,
 * plus a module-level cached promise consumed by React 19's `use()` API.
 *
 * The promise is created once at module evaluation time and cached for the
 * lifetime of the page — re-renders call `use(chainStatePromise)` and
 * instantly receive the resolved value without re-fetching.
 */

export interface ChainTokenState {
  symbol: string;
  name: string;
  contract: string;
  /** Human-readable decimal string, e.g. "9000.000000" — or null if unknown */
  totalSupply: string | null;
  decimals: number;
}

export interface ChainPoolState {
  address: string;
  /** TON reserve as human-readable decimal string — or null if unknown */
  reserveTon: string | null;
  /** CET reserve as human-readable decimal string — or null if unknown */
  reserveCet: string | null;
  /** LP token total supply — or null if unknown */
  lpSupply: string | null;
  /** Spot price in TON per CET — or null if unknown */
  priceTonPerCet: string | null;
}

export interface ChainState {
  token: ChainTokenState;
  pool: ChainPoolState;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Stable module-level promise — safe to pass to React 19 `use()`
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      lastError = new Error(`Failed to fetch chain state: ${res.status}`);
    } catch (err) {
      lastError = err;
    }
    if (attempt < retries) {
      await delay(RETRY_DELAY_MS * (attempt + 1));
    }
  }
  throw lastError;
}

async function fetchChainState(): Promise<ChainState> {
  const base = import.meta.env.BASE_URL ?? './';
  const url  = `${base}api/state.json`;
  const res = await fetchWithRetry(url);
  return res.json() as Promise<ChainState>;
}

export const chainStatePromise: Promise<ChainState> = fetchChainState();
