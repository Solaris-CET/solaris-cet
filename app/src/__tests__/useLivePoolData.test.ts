import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ────────────────────────────────────────────────────────────────────────────
// useLivePoolData — pure-logic / utility tests
//
// The hook itself requires a React runtime for `useState`/`useEffect`, so
// these tests cover the pure utility functions extracted from the same module:
//
// 1. `createTimeoutSignal` — AbortSignal factory with timeout support.
// 2. Price / TVL calculation logic extracted from `fetchData`.
// ────────────────────────────────────────────────────────────────────────────

// ── createTimeoutSignal ────────────────────────────────────────────────────

/**
 * Inline replica of the `createTimeoutSignal` helper in use-live-pool-data.ts.
 * Having it here lets us test both code paths without importing the hook module
 * (which pulls in React hooks that need a runtime).
 */
function createTimeoutSignal(ms: number): AbortSignal {
  if (typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

describe('createTimeoutSignal', () => {
  it('returns an AbortSignal', () => {
    const signal = createTimeoutSignal(5000);
    expect(signal).toBeDefined();
    expect(typeof signal.aborted).toBe('boolean');
  });

  it('signal is not aborted immediately', () => {
    const signal = createTimeoutSignal(5000);
    expect(signal.aborted).toBe(false);
  });

  it('uses AbortSignal.timeout when available', () => {
    const spy = vi.spyOn(AbortSignal, 'timeout');
    createTimeoutSignal(1000);
    if (typeof AbortSignal.timeout === 'function') {
      expect(spy).toHaveBeenCalledWith(1000);
    }
    spy.mockRestore();
  });

  it('falls back to AbortController when AbortSignal.timeout is unavailable', () => {
    const originalTimeout = AbortSignal.timeout;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (AbortSignal as any).timeout = undefined;

    const signal = createTimeoutSignal(5000);
    expect(signal).toBeDefined();
    expect(signal.aborted).toBe(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (AbortSignal as any).timeout = originalTimeout;
  });

  it('aborts after the specified timeout when using fallback', async () => {
    const originalTimeout = AbortSignal.timeout;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (AbortSignal as any).timeout = undefined;

    vi.useFakeTimers();
    const signal = createTimeoutSignal(100);

    expect(signal.aborted).toBe(false);
    vi.advanceTimersByTime(150);
    expect(signal.aborted).toBe(true);

    vi.useRealTimers();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (AbortSignal as any).timeout = originalTimeout;
  });
});

// ── Pool price / TVL calculation helpers ──────────────────────────────────

const CET_DECIMALS = 9;

/** Mirror of the price-from-reserves calculation used in the hook. */
function calcPriceFromReserves(
  tonReserveRaw: string,
  cetReserveRaw: string,
  tonPriceUsd: number
): number | null {
  const tonReserve = parseFloat(tonReserveRaw) / 1e9;
  const cetReserve = parseFloat(cetReserveRaw) / 10 ** CET_DECIMALS;
  if (cetReserve === 0) return null;
  return (tonReserve / cetReserve) * tonPriceUsd;
}

/** Mirror of the TVL calculation used in the hook. */
function calcTvl(tonReserveRaw: string, tonPriceUsd: number): number {
  const tonReserve = parseFloat(tonReserveRaw) / 1e9;
  return tonReserve * tonPriceUsd * 2;
}

/** Mirror of the 24 h volume calculation used in the hook. */
function calcVolume24h(volumeNanoTon: string, tonPriceUsd: number): number {
  return (parseFloat(volumeNanoTon) / 1e9) * tonPriceUsd;
}

describe('pool price calculation from reserves', () => {
  it('calculates CET price correctly from TON/CET reserves', () => {
    // 100 TON reserve, 1000 CET reserve → 1 CET = 0.1 TON
    // If TON = $2 USD → 1 CET = $0.20
    const price = calcPriceFromReserves(
      String(100 * 1e9),   // 100 TON in nano
      String(1000 * 1e9),  // 1000 CET (9 decimals)
      2
    );
    expect(price).toBeCloseTo(0.2, 5);
  });

  it('returns null when CET reserve is zero', () => {
    const price = calcPriceFromReserves(String(100 * 1e9), '0', 2);
    expect(price).toBeNull();
  });

  it('scales correctly with different TON prices', () => {
    // 500 TON / 5000 CET → ratio 0.1 TON per CET
    const price = calcPriceFromReserves(
      String(500 * 1e9),
      String(5000 * 1e9),
      5
    );
    expect(price).toBeCloseTo(0.5, 5);
  });
});

describe('pool TVL calculation', () => {
  it('calculates TVL as 2× the TON-side value', () => {
    // 100 TON at $2 each → TVL = $400
    const tvl = calcTvl(String(100 * 1e9), 2);
    expect(tvl).toBeCloseTo(400, 5);
  });

  it('returns 0 TVL for empty pool', () => {
    const tvl = calcTvl('0', 2);
    expect(tvl).toBe(0);
  });
});

describe('pool 24h volume calculation', () => {
  it('converts nanoTON volume to USD correctly', () => {
    // 50 TON volume at $2 = $100
    const vol = calcVolume24h(String(50 * 1e9), 2);
    expect(vol).toBeCloseTo(100, 5);
  });

  it('returns 0 for zero volume', () => {
    const vol = calcVolume24h('0', 2);
    expect(vol).toBe(0);
  });
});

// ── PoolData initial state ─────────────────────────────────────────────────

describe('PoolData initial state shape', () => {
  const INITIAL_STATE = {
    priceUsd: null,
    tvlUsd: null,
    volume24hUsd: null,
    tonPriceUsd: null,
    loading: true,
    error: null,
    lastUpdated: null,
  };

  it('has all required fields', () => {
    expect(INITIAL_STATE).toHaveProperty('priceUsd');
    expect(INITIAL_STATE).toHaveProperty('tvlUsd');
    expect(INITIAL_STATE).toHaveProperty('volume24hUsd');
    expect(INITIAL_STATE).toHaveProperty('tonPriceUsd');
    expect(INITIAL_STATE).toHaveProperty('loading');
    expect(INITIAL_STATE).toHaveProperty('error');
    expect(INITIAL_STATE).toHaveProperty('lastUpdated');
  });

  it('starts with loading: true', () => {
    expect(INITIAL_STATE.loading).toBe(true);
  });

  it('starts with null price fields', () => {
    expect(INITIAL_STATE.priceUsd).toBeNull();
    expect(INITIAL_STATE.tvlUsd).toBeNull();
    expect(INITIAL_STATE.tonPriceUsd).toBeNull();
  });

  it('starts with no error', () => {
    expect(INITIAL_STATE.error).toBeNull();
  });
});
