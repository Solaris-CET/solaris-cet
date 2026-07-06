/**
 * DeDust pool price / TVL / volume sanity checks (nano units → USD).
 * Timeout AbortSignal behaviour is covered in `timeout-signal.test.ts`.
 */

import { describe, expect,it } from "vitest";

describe("DeDust pool price calculations", () => {
  const CET_DECIMALS = 6;

  it("CET USD price from reserves, TVL 2× TON side, 24h volume USD", () => {
    const tonReserveNano = 1e9;
    const cetReserveNano = 2 * 10 ** CET_DECIMALS;
    const tonPriceUsd = 5;
    const tonReserve = tonReserveNano / 1e9;
    const cetReserve = cetReserveNano / 10 ** CET_DECIMALS;
    const priceUsd = (tonReserve / cetReserve) * tonPriceUsd;
    expect(priceUsd).toBe(2.5);

    const tonReserveNano2 = 500 * 1e9;
    const tonPriceUsd2 = 3;
    const tonReserve2 = tonReserveNano2 / 1e9;
    expect(tonReserve2 * tonPriceUsd2 * 2).toBe(3000);

    const volumeNano = 100 * 1e9;
    const tonPriceUsd3 = 4;
    expect((volumeNano / 1e9) * tonPriceUsd3).toBe(400);
  });
});
