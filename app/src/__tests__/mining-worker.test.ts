import { describe, it, expect } from "vitest";

/**
 * Unit tests for the mining reward calculation logic.
 *
 * The actual calculation is mirrored here (same formula as in
 * `src/workers/mining.worker.ts`) so we can validate correctness without
 * spinning up a real Web Worker in the test environment.
 */

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

describe("calculateRewards", () => {
  it("returns correct values for zero stake and unit hashrate", () => {
    const result = calculateRewards({ adjustedHashrate: 1, stake: 0 });
    expect(result.daily).toBeCloseTo(0.0082, 4);
    expect(result.monthly).toBeCloseTo(0.0082 * 30, 2);
    expect(result.apy).toBeCloseTo(15.1, 1);
  });

  it("stakeMultiplier of 1 when stake is 0", () => {
    const result = calculateRewards({ adjustedHashrate: 1, stake: 0 });
    // daily = 1 * 0.0082 * (1 + 0/10000) = 0.0082
    expect(result.daily).toBe(0.0082);
  });

  it("stakeMultiplier doubles at max stake (10,000)", () => {
    const noStake = calculateRewards({ adjustedHashrate: 1, stake: 0 });
    const maxStake = calculateRewards({ adjustedHashrate: 1, stake: 10_000 });
    expect(maxStake.daily).toBeCloseTo(noStake.daily * 2, 4);
  });

  it("scales linearly with hashrate", () => {
    const r1 = calculateRewards({ adjustedHashrate: 2, stake: 0 });
    const r2 = calculateRewards({ adjustedHashrate: 4, stake: 0 });
    expect(r2.daily).toBeCloseTo(r1.daily * 2, 4);
  });

  it("monthly is daily × 30", () => {
    const result = calculateRewards({ adjustedHashrate: 5, stake: 500 });
    expect(result.monthly).toBeCloseTo(result.daily * 30, 2);
  });

  it("base APY is 15% when stake and hashrate are zero", () => {
    const result = calculateRewards({ adjustedHashrate: 0, stake: 0 });
    expect(result.apy).toBe(15.0);
  });

  it("APY increases with stake", () => {
    const low = calculateRewards({ adjustedHashrate: 1, stake: 0 });
    const high = calculateRewards({ adjustedHashrate: 1, stake: 5_000 });
    expect(high.apy).toBeGreaterThan(low.apy);
  });

  it("APY increases with hashrate", () => {
    const low = calculateRewards({ adjustedHashrate: 1, stake: 0 });
    const high = calculateRewards({ adjustedHashrate: 10, stake: 0 });
    expect(high.apy).toBeGreaterThan(low.apy);
  });

  it("handles smartphone-scale hashrate (0.5 TH/s)", () => {
    const result = calculateRewards({ adjustedHashrate: 0.5, stake: 100 });
    expect(result.daily).toBeGreaterThan(0);
    expect(result.monthly).toBeGreaterThan(0);
    expect(result.apy).toBeGreaterThan(15);
  });

  it("handles dedicated-node hashrate (50 TH/s)", () => {
    const result = calculateRewards({ adjustedHashrate: 50, stake: 10_000 });
    // daily = 50 * 0.0082 * 2 = 0.82
    expect(result.daily).toBeCloseTo(0.82, 2);
    expect(result.apy).toBeGreaterThan(15);
  });

  it("result values are rounded correctly", () => {
    const result = calculateRewards({ adjustedHashrate: 2.5, stake: 150 });
    // Verify precision: daily has 4 decimal places max, monthly 2, apy 1
    const dailyStr = result.daily.toString();
    const decimalPart = dailyStr.includes(".") ? dailyStr.split(".")[1] : "";
    expect(decimalPart.length).toBeLessThanOrEqual(4);
  });
});
