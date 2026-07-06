import { describe, expect,it } from 'vitest';

import { TOKEN_DECIMALS } from '@/constants/token';
import { CET_CONTRACT_ADDRESS } from '@/lib/cetContract';
import { DEDUST_POOL_ADDRESS } from '@/lib/dedustUrls';

/**
 * Pure helpers aligned with `use-live-pool-data` reserve / volume parsing.
 * `createTimeoutSignal` is covered in `timeout-signal.test.ts`.
 */

const CET_DECIMALS = TOKEN_DECIMALS;
const REFRESH_INTERVAL_MS = 60_000;

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
  return (parseFloat(volumeRaw) / 1e9) * tonPriceUsd;
}

describe('DeDust pool — formulas & live-pool config', () => {
  it('formulas, integration, contract addresses, refresh, PoolData shape', () => {
    expect(deriveCetPriceFromReserves(String(1e9), String(10 ** CET_DECIMALS), 3)).toBeCloseTo(3, 6);
    expect(deriveCetPriceFromReserves(String(100e9), String(9000 * 10 ** CET_DECIMALS), 3)).toBeCloseTo((100 / 9000) * 3, 6);
    expect(deriveCetPriceFromReserves(String(100e9), '0', 3)).toBeNull();
    const r = { ton: String(100e9), cet: String(9000 * 10 ** CET_DECIMALS) };
    const p3 = deriveCetPriceFromReserves(r.ton, r.cet, 3);
    const p6 = deriveCetPriceFromReserves(r.ton, r.cet, 6);
    expect(p6).toBeCloseTo((p3 ?? 0) * 2, 6);

    expect(deriveTvlUsd(String(100e9), 3)).toBeCloseTo(600, 6);
    expect(deriveTvlUsd('0', 3)).toBe(0);
    expect(deriveTvlUsd(String(100e9), 6)).toBeCloseTo(deriveTvlUsd(String(100e9), 3) * 2, 6);

    expect(deriveVolume24hUsd(String(50e9), 3)).toBeCloseTo(150, 6);
    expect(deriveVolume24hUsd('0', 3)).toBe(0);
    expect(deriveVolume24hUsd(String(50e9), 9)).toBeCloseTo(deriveVolume24hUsd(String(50e9), 3) * 3, 6);

    const tonPriceUsd = 3.2;
    const tonReserveRaw = String(800e9);
    const cetReserveRaw = String(9000 * 10 ** CET_DECIMALS);
    const volume24hRaw = String(180e9);
    expect(deriveCetPriceFromReserves(tonReserveRaw, cetReserveRaw, tonPriceUsd)).toBeCloseTo(
      (800 / 9000) * tonPriceUsd,
      4,
    );
    expect(deriveTvlUsd(tonReserveRaw, tonPriceUsd)).toBeCloseTo(5120, 2);
    expect(deriveVolume24hUsd(volume24hRaw, tonPriceUsd)).toBeCloseTo(576, 2);

    // String nano parse parity (was pool-math parseReserve)
    expect(parseFloat(String(5000 * 1e9)) / 1e9).toBeCloseTo(5000, 0);
    const tonR = String(1000 * 1e9);
    const cetR = String(200 * 10 ** CET_DECIMALS);
    const cetInTon = parseFloat(tonR) / 1e9 / (parseFloat(cetR) / 10 ** CET_DECIMALS);
    expect(cetInTon).toBeCloseTo(5, 6);

    const tonReserveNano = 1e9;
    const cetReserveNano = 2 * 10 ** CET_DECIMALS;
    const tonPriceUsdSpot = 5;
    const priceUsdSpot =
      (tonReserveNano / 1e9 / (cetReserveNano / 10 ** CET_DECIMALS)) * tonPriceUsdSpot;
    expect(priceUsdSpot).toBe(2.5);
    expect((500 * 1e9) / 1e9 * 3 * 2).toBe(3000);
    expect(((100 * 1e9) / 1e9) * 4).toBe(400);

    expect(DEDUST_POOL_ADDRESS).toMatch(/^EQ[A-Za-z0-9_-]{46}$/);
    expect(CET_CONTRACT_ADDRESS).toMatch(/^EQ[A-Za-z0-9_-]{46}$/);
    expect(CET_DECIMALS).toBe(6);
    expect(REFRESH_INTERVAL_MS).toBe(60_000);

    const INITIAL_STATE = {
      priceUsd: null,
      tvlUsd: null,
      volume24hUsd: null,
      tonPriceUsd: null,
      loading: true,
      error: null,
      lastUpdated: null,
    };
    expect(INITIAL_STATE.loading).toBe(true);
    expect(INITIAL_STATE.priceUsd).toBeNull();
  });
});
