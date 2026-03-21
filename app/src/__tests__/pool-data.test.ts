import { describe, it, expect } from 'vitest';

/**
 * Tests for the DeDust pool data transformation logic used in
 * hooks/use-live-pool-data.ts. These tests validate the core arithmetic
 * for price derivation, TVL calculation, and volume parsing without
 * requiring network calls or React hook machinery.
 *
 * All numbers match the on-chain data conventions:
 *   - TON amounts stored as nanoTON (divide by 1e9)
 *   - CET amounts stored as nano-CET (divide by 10 ** CET_DECIMALS = 10 ** 9)
 */

const CET_DECIMALS = 9;

// ---------------------------------------------------------------------------
// Pure helpers replicated from use-live-pool-data.ts for isolated testing
// ---------------------------------------------------------------------------

function deriveCetPriceFromReserves(
  tonReserveRaw: string,
  cetReserveRaw: string,
  tonPriceUsd: number,
): number | null {
  const tonReserve = parseFloat(tonReserveRaw) / 1e9;
  const cetReserve = parseFloat(cetReserveRaw) / 10 ** CET_DECIMALS;
  if (cetReserve === 0) return null;
  return (tonReserve / cetReserve) * tonPriceUsd;
}

function deriveTvlUsd(tonReserveRaw: string, tonPriceUsd: number): number {
  const tonReserve = parseFloat(tonReserveRaw) / 1e9;
  return tonReserve * tonPriceUsd * 2;
}

function deriveVolume24hUsd(volumeRaw: string, tonPriceUsd: number): number {
  const volumeTon = parseFloat(volumeRaw) / 1e9;
  return volumeTon * tonPriceUsd;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Pool data calculations', () => {
  describe('deriveCetPriceFromReserves', () => {
    it('computes CET price correctly for equal reserves', () => {
      // 1 TON reserve, 1 CET reserve, TON = $3
      // price = (1 / 1) * 3 = $3
      const price = deriveCetPriceFromReserves(
        String(1e9),      // 1 TON in nanoTON
        String(1e9),      // 1 CET in nano-CET
        3,
      );
      expect(price).toBeCloseTo(3, 6);
    });

    it('computes CET price correctly when pool has 100 TON and 9000 CET', () => {
      // 100 TON / 9000 CET = 0.01111... TON per CET
      // At TON = $3: price = 0.01111 * 3 ≈ $0.0333
      const price = deriveCetPriceFromReserves(
        String(100e9),    // 100 TON
        String(9000e9),   // 9000 CET
        3,
      );
      expect(price).toBeCloseTo((100 / 9000) * 3, 6);
    });

    it('returns null when CET reserve is 0', () => {
      const price = deriveCetPriceFromReserves(String(100e9), '0', 3);
      expect(price).toBeNull();
    });

    it('scales with TON price', () => {
      const reserves = { ton: String(100e9), cet: String(9000e9) };
      const priceAt3 = deriveCetPriceFromReserves(reserves.ton, reserves.cet, 3);
      const priceAt6 = deriveCetPriceFromReserves(reserves.ton, reserves.cet, 6);
      expect(priceAt6).toBeCloseTo((priceAt3 ?? 0) * 2, 6);
    });
  });

  describe('deriveTvlUsd', () => {
    it('TVL equals twice the TON-side value (symmetric pool)', () => {
      // 100 TON at $3 → TVL = 100 * 3 * 2 = $600
      const tvl = deriveTvlUsd(String(100e9), 3);
      expect(tvl).toBeCloseTo(600, 6);
    });

    it('TVL is 0 when TON reserve is 0', () => {
      expect(deriveTvlUsd('0', 3)).toBe(0);
    });

    it('TVL scales with TON price', () => {
      const tvlAt3 = deriveTvlUsd(String(100e9), 3);
      const tvlAt6 = deriveTvlUsd(String(100e9), 6);
      expect(tvlAt6).toBeCloseTo(tvlAt3 * 2, 6);
    });
  });

  describe('deriveVolume24hUsd', () => {
    it('converts nanoTON volume to USD correctly', () => {
      // 50 TON volume at $3 → $150
      const vol = deriveVolume24hUsd(String(50e9), 3);
      expect(vol).toBeCloseTo(150, 6);
    });

    it('returns 0 for a zero-volume period', () => {
      expect(deriveVolume24hUsd('0', 3)).toBe(0);
    });

    it('scales linearly with TON price', () => {
      const volAt3 = deriveVolume24hUsd(String(50e9), 3);
      const volAt9 = deriveVolume24hUsd(String(50e9), 9);
      expect(volAt9).toBeCloseTo(volAt3 * 3, 6);
    });
  });

  describe('integration — consistent pool snapshot', () => {
    it('price, TVL and volume are all consistent for a typical pool state', () => {
      const tonPriceUsd = 3.2;
      const tonReserveRaw = String(800e9);  // 800 TON
      const cetReserveRaw = String(9000e9); // 9000 CET
      const volume24hRaw = String(180e9);  // 180 TON traded

      const price = deriveCetPriceFromReserves(tonReserveRaw, cetReserveRaw, tonPriceUsd);
      const tvl = deriveTvlUsd(tonReserveRaw, tonPriceUsd);
      const vol = deriveVolume24hUsd(volume24hRaw, tonPriceUsd);

      // price ≈ (800/9000) * 3.2
      expect(price).toBeCloseTo((800 / 9000) * tonPriceUsd, 4);
      // tvl = 800 * 3.2 * 2 = 5120
      expect(tvl).toBeCloseTo(5120, 2);
      // vol = 180 * 3.2 = 576
      expect(vol).toBeCloseTo(576, 2);
    });
  });
});
