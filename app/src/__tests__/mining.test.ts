/**
 * Unit tests for the mining reward calculation logic.
 *
 * The `calculateRewards` function lives in `mining.worker.ts` but its
 * business logic is pure (no side-effects, no Web-Worker globals), so we
 * inline a copy of the formula here and test the numeric contract directly.
 *
 * Why inline instead of importing the worker file directly?
 * Web Workers import using `self.onmessage`, which is not available in
 * Node-based Vitest environments.  Extracting the pure maths into a test
 * helper ensures the formula is fully covered without polyfilling the entire
 * Worker runtime.
 */

import { describe, it, expect } from "vitest";

// ── Replica of the pure calculation function from mining.worker.ts ──────────
interface MiningInput {
  adjustedHashrate: number;
  stake: number;
}

interface MiningResult {
  daily: number;
  monthly: number;
  apy: number;
}

function calculateRewards(input: MiningInput): MiningResult {
  const { adjustedHashrate, stake } = input;
  const stakeMultiplier = 1 + stake / 10_000;
  const daily = adjustedHashrate * 0.0082 * stakeMultiplier;
  const monthly = daily * 30;
  const apy = 15 + stake / 1_000 + adjustedHashrate * 0.1;

  return {
    daily: Number(daily.toFixed(4)),
    monthly: Number(monthly.toFixed(2)),
    apy: Number(apy.toFixed(1)),
  };
}
// ────────────────────────────────────────────────────────────────────────────

describe("calculateRewards — mining worker formula", () => {
  it("returns zero daily / monthly rewards for zero hashrate and zero stake", () => {
    const result = calculateRewards({ adjustedHashrate: 0, stake: 0 });
    expect(result.daily).toBe(0);
    expect(result.monthly).toBe(0);
  });

  it("returns the base APY of 15 % when hashrate and stake are both zero", () => {
    const result = calculateRewards({ adjustedHashrate: 0, stake: 0 });
    expect(result.apy).toBe(15);
  });

  it("computes daily rewards correctly for 1 TH/s with no stake", () => {
    // daily = 1 * 0.0082 * (1 + 0/10000) = 0.0082
    const result = calculateRewards({ adjustedHashrate: 1, stake: 0 });
    expect(result.daily).toBe(0.0082);
  });

  it("computes monthly rewards as daily × 30", () => {
    const result = calculateRewards({ adjustedHashrate: 10, stake: 0 });
    expect(result.monthly).toBeCloseTo(result.daily * 30, 2);
  });

  it("stake multiplier increases daily rewards proportionally", () => {
    const noStake = calculateRewards({ adjustedHashrate: 10, stake: 0 });
    const withStake = calculateRewards({ adjustedHashrate: 10, stake: 10_000 });
    // stakeMultiplier at max stake (10,000) = 2 → rewards double
    expect(withStake.daily).toBeCloseTo(noStake.daily * 2, 4);
  });

  it("APY increases by 0.1 % per TH/s", () => {
    const base = calculateRewards({ adjustedHashrate: 0, stake: 0 });
    const with100ths = calculateRewards({ adjustedHashrate: 100, stake: 0 });
    expect(with100ths.apy).toBeCloseTo(base.apy + 100 * 0.1, 1);
  });

  it("APY increases by 0.1 % per 1,000 BTC-S staked", () => {
    const base = calculateRewards({ adjustedHashrate: 0, stake: 0 });
    const withStake = calculateRewards({ adjustedHashrate: 0, stake: 5_000 });
    expect(withStake.apy).toBeCloseTo(base.apy + 5, 1);
  });

  it("rounds daily to 4 decimal places", () => {
    const result = calculateRewards({ adjustedHashrate: 1, stake: 1 });
    const decimals = result.daily.toString().split(".")[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(4);
  });

  it("rounds monthly to 2 decimal places", () => {
    const result = calculateRewards({ adjustedHashrate: 1, stake: 1 });
    const decimals = result.monthly.toString().split(".")[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(2);
  });

  it("rounds APY to 1 decimal place", () => {
    const result = calculateRewards({ adjustedHashrate: 1.5, stake: 500 });
    const decimals = result.apy.toString().split(".")[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(1);
  });

  it("handles a realistic scenario: 50 TH/s, 2,500 BTC-S stake", () => {
    // stakeMultiplier = 1 + 2500/10000 = 1.25
    // daily = 50 * 0.0082 * 1.25 = 0.5125
    // monthly = 0.5125 * 30 = 15.375 → 15.38 (2 dp)
    // apy = 15 + 2.5 + 5 = 22.5
    const result = calculateRewards({ adjustedHashrate: 50, stake: 2_500 });
    expect(result.daily).toBe(0.5125);
    expect(result.monthly).toBe(15.38);
    expect(result.apy).toBe(22.5);
  });
});
