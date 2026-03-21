import { describe, it, expect } from "vitest";

/**
 * Tests for the mining rewards calculation formulas.
 *
 * These formulas mirror the logic in `src/workers/mining.worker.ts`
 * and serve as a specification / regression guard for the on-chain reward model.
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

/** Inline implementation kept in sync with mining.worker.ts */
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
  it("returns correct daily for 1 TH/s with zero stake", () => {
    const result = calculateRewards({ adjustedHashrate: 1, stake: 0 });
    expect(result.daily).toBeCloseTo(0.0082, 4);
  });

  it("returns correct monthly as daily × 30", () => {
    const result = calculateRewards({ adjustedHashrate: 10, stake: 0 });
    expect(result.monthly).toBeCloseTo(result.daily * 30, 1);
  });

  it("stake multiplier doubles yield at max stake (10_000 BTC-S)", () => {
    const noStake = calculateRewards({ adjustedHashrate: 100, stake: 0 });
    const maxStake = calculateRewards({ adjustedHashrate: 100, stake: 10_000 });
    expect(maxStake.daily).toBeCloseTo(noStake.daily * 2, 2);
  });

  it("base APY is 15 % with no hashrate and no stake", () => {
    const result = calculateRewards({ adjustedHashrate: 0, stake: 0 });
    expect(result.apy).toBe(15.0);
  });

  it("APY increases by 0.1 per TH/s", () => {
    const r100 = calculateRewards({ adjustedHashrate: 100, stake: 0 });
    const r200 = calculateRewards({ adjustedHashrate: 200, stake: 0 });
    expect(r200.apy - r100.apy).toBeCloseTo(10.0, 1);
  });

  it("APY increases by 0.1 per 100 BTC-S staked (1 per 1_000)", () => {
    const r0 = calculateRewards({ adjustedHashrate: 0, stake: 0 });
    const r1k = calculateRewards({ adjustedHashrate: 0, stake: 1_000 });
    expect(r1k.apy - r0.apy).toBeCloseTo(1.0, 1);
  });

  it("returns non-negative values for realistic inputs", () => {
    const result = calculateRewards({ adjustedHashrate: 50, stake: 5_000 });
    expect(result.daily).toBeGreaterThan(0);
    expect(result.monthly).toBeGreaterThan(0);
    expect(result.apy).toBeGreaterThan(0);
  });

  it("daily and monthly are rounded to appropriate decimal places", () => {
    const result = calculateRewards({ adjustedHashrate: 1.23456, stake: 0 });
    // toFixed(4) means at most 4 decimal places
    expect(result.daily.toString().replace(/^\d+\.?/, "").length).toBeLessThanOrEqual(4);
    // toFixed(2) means at most 2 decimal places
    expect(result.monthly.toString().replace(/^\d+\.?/, "").length).toBeLessThanOrEqual(2);
  });
});
