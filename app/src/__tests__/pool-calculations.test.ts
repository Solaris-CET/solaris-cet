import { describe, it, expect } from "vitest";

/**
 * Tests for pool price / TVL calculation formulas used in use-live-pool-data.ts.
 *
 * These tests verify the mathematical correctness of the DeDust pool data
 * transformations without requiring network access or browser APIs.
 */

const CET_DECIMALS = 9;

/**
 * Derive spot price from pool reserves.
 * Mirrors the logic in `useLivePoolData` in `src/hooks/use-live-pool-data.ts`.
 */
function priceFromReserves(
  tonReserveNano: number,
  cetReserveNano: number,
  tonPriceUsd: number
): number | null {
  const tonReserve = tonReserveNano / 1e9;
  const cetReserve = cetReserveNano / 10 ** CET_DECIMALS;
  if (cetReserve <= 0) return null;
  return (tonReserve / cetReserve) * tonPriceUsd;
}

/**
 * Calculate TVL in USD from the TON-side reserve of a symmetric pool.
 * TVL = 2 × (TON reserve × TON price USD)
 */
function tvlFromTonReserve(tonReserveNano: number, tonPriceUsd: number): number {
  const tonReserve = tonReserveNano / 1e9;
  return tonReserve * tonPriceUsd * 2;
}

/**
 * Convert a 24-h volume expressed in nanoTON to USD.
 */
function volumeUsd(volumeNanoTon: number, tonPriceUsd: number): number {
  return (volumeNanoTon / 1e9) * tonPriceUsd;
}

describe("priceFromReserves", () => {
  it("calculates CET price correctly from reserves", () => {
    // 100 TON reserve, 1000 CET reserve, TON = $5 → CET price = (100/1000) * 5 = $0.50
    const tonNano = 100 * 1e9;
    const cetNano = 1_000 * 1e9;
    const tonPrice = 5;
    expect(priceFromReserves(tonNano, cetNano, tonPrice)).toBeCloseTo(0.5, 6);
  });

  it("returns null when CET reserve is zero (avoids division by zero)", () => {
    expect(priceFromReserves(100 * 1e9, 0, 5)).toBeNull();
  });

  it("scales linearly with TON price", () => {
    const tonNano = 200 * 1e9;
    const cetNano = 1_000 * 1e9;
    const p1 = priceFromReserves(tonNano, cetNano, 3);
    const p2 = priceFromReserves(tonNano, cetNano, 6);
    expect(p2).not.toBeNull();
    expect(p1).not.toBeNull();
    expect(p2! / p1!).toBeCloseTo(2, 5);
  });

  it("scales linearly with TON reserve", () => {
    const cetNano = 500 * 1e9;
    const tonPrice = 4;
    const p1 = priceFromReserves(100 * 1e9, cetNano, tonPrice);
    const p2 = priceFromReserves(200 * 1e9, cetNano, tonPrice);
    expect(p2).not.toBeNull();
    expect(p1).not.toBeNull();
    expect(p2! / p1!).toBeCloseTo(2, 5);
  });

  it("correctly handles CET decimal precision (9 decimals)", () => {
    // 1 TON and 1 CET (each in nanotons / nano-CET)
    const tonNano = 1 * 1e9;
    const cetNano = 1 * 1e9;
    const tonPrice = 10;
    // price = (1 / 1) * 10 = $10
    expect(priceFromReserves(tonNano, cetNano, tonPrice)).toBeCloseTo(10, 6);
  });
});

describe("tvlFromTonReserve", () => {
  it("TVL equals 2 × TON reserve × TON price USD", () => {
    // 500 TON in reserve, $3 per TON → TVL = 2 × 500 × 3 = $3 000
    const tonNano = 500 * 1e9;
    expect(tvlFromTonReserve(tonNano, 3)).toBeCloseTo(3_000, 2);
  });

  it("TVL is zero when reserve is zero", () => {
    expect(tvlFromTonReserve(0, 5)).toBe(0);
  });

  it("TVL scales with TON price", () => {
    const tonNano = 100 * 1e9;
    expect(tvlFromTonReserve(tonNano, 10)).toBeCloseTo(
      tvlFromTonReserve(tonNano, 5) * 2,
      2
    );
  });
});

describe("volumeUsd", () => {
  it("converts nanoTON volume to USD correctly", () => {
    // 50 TON volume, $4 per TON → $200
    const nanoVol = 50 * 1e9;
    expect(volumeUsd(nanoVol, 4)).toBeCloseTo(200, 2);
  });

  it("returns zero for zero volume", () => {
    expect(volumeUsd(0, 5)).toBe(0);
  });

  it("scales linearly with TON price", () => {
    const nanoVol = 10 * 1e9;
    expect(volumeUsd(nanoVol, 6)).toBeCloseTo(volumeUsd(nanoVol, 3) * 2, 2);
  });
});
