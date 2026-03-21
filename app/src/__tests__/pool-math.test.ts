import { describe, it, expect } from 'vitest';

/**
 * Tests for the pure mathematical helpers used in useLivePoolData.
 *
 * The hook itself requires a browser environment (fetch, setInterval), but
 * the core reserve-based pricing formulae can be extracted and verified in
 * pure Node / Vitest environment.
 */

const CET_DECIMALS = 9;
const TON_DECIMALS = 9;

/** Convert raw nanoTON/nanoCET reserve strings to human-readable floats */
function parseReserve(raw: string, decimals: number): number {
  return parseFloat(raw) / 10 ** decimals;
}

/** Calculate CET price in TON from pool reserves (constant-product AMM) */
function calcCetPriceInTon(tonReserveRaw: string, cetReserveRaw: string): number | null {
  const tonReserve = parseReserve(tonReserveRaw, TON_DECIMALS);
  const cetReserve = parseReserve(cetReserveRaw, CET_DECIMALS);
  if (cetReserve <= 0) return null;
  return tonReserve / cetReserve;
}

/** Calculate TVL in USD from TON-side reserve (symmetric pool: TVL = 2× TON side) */
function calcTvlUsd(tonReserveRaw: string, tonPriceUsd: number): number {
  const tonReserve = parseReserve(tonReserveRaw, TON_DECIMALS);
  return tonReserve * tonPriceUsd * 2;
}

/** Convert 24h volume from nano-units to USD */
function calcVolume24hUsd(volumeNano: string, tonPriceUsd: number): number {
  const volumeTon = parseFloat(volumeNano) / 1e9;
  return volumeTon * tonPriceUsd;
}

describe('pool reserve math', () => {
  describe('parseReserve', () => {
    it('converts nanoTON string to TON float', () => {
      expect(parseReserve('5000000000000', TON_DECIMALS)).toBeCloseTo(5000, 0);
    });

    it('converts nanoCET string to CET float', () => {
      expect(parseReserve('1000000000000', CET_DECIMALS)).toBeCloseTo(1000, 0);
    });

    it('handles zero reserve', () => {
      expect(parseReserve('0', TON_DECIMALS)).toBe(0);
    });
  });

  describe('calcCetPriceInTon', () => {
    it('calculates CET price in TON correctly for a balanced pool', () => {
      // 1000 TON : 200 CET → price = 5 TON/CET
      const tonReserveRaw = String(1000 * 1e9);
      const cetReserveRaw = String(200 * 1e9);
      expect(calcCetPriceInTon(tonReserveRaw, cetReserveRaw)).toBeCloseTo(5, 6);
    });

    it('calculates CET price correctly for an imbalanced pool', () => {
      // 9000 TON : 1 CET → price = 9000 TON/CET
      const tonReserveRaw = String(9000 * 1e9);
      const cetReserveRaw = String(1 * 1e9);
      expect(calcCetPriceInTon(tonReserveRaw, cetReserveRaw)).toBeCloseTo(9000, 4);
    });

    it('returns null when CET reserve is zero (prevents division by zero)', () => {
      expect(calcCetPriceInTon(String(1000 * 1e9), '0')).toBeNull();
    });
  });

  describe('calcTvlUsd', () => {
    it('calculates TVL as 2× TON side in USD', () => {
      // 500 TON in reserve, TON price = $2 → TVL = 500 × 2 × 2 = $2000
      const tonReserveRaw = String(500 * 1e9);
      const tonPriceUsd = 2;
      expect(calcTvlUsd(tonReserveRaw, tonPriceUsd)).toBeCloseTo(2000, 4);
    });

    it('scales correctly with larger reserves', () => {
      // 10_000 TON at $3.50 → TVL = 10_000 × 3.50 × 2 = $70_000
      const tonReserveRaw = String(10_000 * 1e9);
      expect(calcTvlUsd(tonReserveRaw, 3.5)).toBeCloseTo(70_000, 2);
    });
  });

  describe('calcVolume24hUsd', () => {
    it('converts nano volume to USD', () => {
      // 100 TON volume, TON price = $3 → $300
      const volumeNano = String(100 * 1e9);
      expect(calcVolume24hUsd(volumeNano, 3)).toBeCloseTo(300, 4);
    });

    it('handles zero volume', () => {
      expect(calcVolume24hUsd('0', 3)).toBe(0);
    });
  });

  describe('end-to-end price derivation scenario', () => {
    it('correctly derives CET USD price from pool reserves and TON price', () => {
      const tonReserveRaw = String(5000 * 1e9);   // 5000 TON
      const cetReserveRaw = String(1000 * 1e9);   // 1000 CET
      const tonPriceUsd = 3.5;

      const cetPriceInTon = calcCetPriceInTon(tonReserveRaw, cetReserveRaw)!;
      const cetPriceUsd = cetPriceInTon * tonPriceUsd;

      // 5000 TON / 1000 CET = 5 TON/CET × $3.50 = $17.50 per CET
      expect(cetPriceUsd).toBeCloseTo(17.5, 4);
    });
  });
});
