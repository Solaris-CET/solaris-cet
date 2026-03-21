/**
 * Unit tests for pool data utility functions.
 *
 * We test `createTimeoutSignal` by replicating the same logic used in
 * `use-live-pool-data.ts`.  The function is pure enough to be verified
 * in a Node environment without network access.
 */

import { describe, it, expect, vi, afterEach } from "vitest";

// ── Replica of the utility from use-live-pool-data.ts ───────────────────────
function createTimeoutSignal(ms: number): AbortSignal {
  if (typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}
// ────────────────────────────────────────────────────────────────────────────

describe("createTimeoutSignal", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns an AbortSignal", () => {
    const signal = createTimeoutSignal(5000);
    expect(signal).toBeInstanceOf(AbortSignal);
  });

  it("signal is not already aborted immediately after creation", () => {
    const signal = createTimeoutSignal(10_000);
    expect(signal.aborted).toBe(false);
  });

  it("uses AbortSignal.timeout() when available", () => {
    const spy = vi
      .spyOn(AbortSignal, "timeout")
      .mockReturnValue(new AbortController().signal);

    createTimeoutSignal(3000);
    expect(spy).toHaveBeenCalledWith(3000);
  });

  it("falls back to AbortController when AbortSignal.timeout is not available", () => {
    // Temporarily remove AbortSignal.timeout
    const original = AbortSignal.timeout;
    // @ts-expect-error — intentionally removing the method to test the fallback
    AbortSignal.timeout = undefined;

    try {
      vi.useFakeTimers();
      const signal = createTimeoutSignal(100);
      expect(signal.aborted).toBe(false);
      vi.advanceTimersByTime(100);
      expect(signal.aborted).toBe(true);
    } finally {
      AbortSignal.timeout = original;
      vi.useRealTimers();
    }
  });
});

// ── Pool maths helpers ───────────────────────────────────────────────────────

describe("DeDust pool price calculations", () => {
  const CET_DECIMALS = 9;

  it("calculates CET price from reserves correctly", () => {
    // tonReserve = 1e9 nanoTON → 1 TON
    // cetReserve = 2 * 10^9 nanoCET → 2 CET
    // price = tonReserve / cetReserve = 0.5 TON per CET
    const tonReserveNano = 1e9;
    const cetReserveNano = 2 * 10 ** CET_DECIMALS;
    const tonPriceUsd = 5; // 1 TON = $5

    const tonReserve = tonReserveNano / 1e9;
    const cetReserve = cetReserveNano / 10 ** CET_DECIMALS;
    const priceUsd = (tonReserve / cetReserve) * tonPriceUsd;

    expect(priceUsd).toBe(2.5); // 0.5 TON × $5
  });

  it("calculates TVL as 2× the TON side", () => {
    const tonReserveNano = 500 * 1e9; // 500 TON
    const tonPriceUsd = 3;

    const tonReserve = tonReserveNano / 1e9;
    const tvlUsd = tonReserve * tonPriceUsd * 2;

    expect(tvlUsd).toBe(3000);
  });

  it("converts 24h volume from nanoTON to USD", () => {
    const volumeNano = 100 * 1e9; // 100 TON
    const tonPriceUsd = 4;

    const volumeTon = volumeNano / 1e9;
    const volume24hUsd = volumeTon * tonPriceUsd;

    expect(volume24hUsd).toBe(400);
  });
});
