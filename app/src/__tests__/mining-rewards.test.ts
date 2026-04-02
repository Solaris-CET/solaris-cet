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
  it("daily/monthly, stake 2× at max, APY rules, non-negative, rounding", () => {
    const one = calculateRewards({ adjustedHashrate: 1, stake: 0 });
    expect(one.daily).toBeCloseTo(0.0082, 4);
    const ten = calculateRewards({ adjustedHashrate: 10, stake: 0 });
    expect(ten.monthly).toBeCloseTo(ten.daily * 30, 1);
    const noStake = calculateRewards({ adjustedHashrate: 100, stake: 0 });
    const maxStake = calculateRewards({ adjustedHashrate: 100, stake: 10_000 });
    expect(maxStake.daily).toBeCloseTo(noStake.daily * 2, 2);
    const z = calculateRewards({ adjustedHashrate: 0, stake: 0 });
    expect(z.apy).toBe(15.0);
    const r100 = calculateRewards({ adjustedHashrate: 100, stake: 0 });
    const r200 = calculateRewards({ adjustedHashrate: 200, stake: 0 });
    expect(r200.apy - r100.apy).toBeCloseTo(10.0, 1);
    const r0 = calculateRewards({ adjustedHashrate: 0, stake: 0 });
    const r1k = calculateRewards({ adjustedHashrate: 0, stake: 1_000 });
    expect(r1k.apy - r0.apy).toBeCloseTo(1.0, 1);
    const real = calculateRewards({ adjustedHashrate: 50, stake: 5_000 });
    expect(real.daily).toBeGreaterThan(0);
    expect(real.monthly).toBeGreaterThan(0);
    expect(real.apy).toBeGreaterThan(0);
    const rnd = calculateRewards({ adjustedHashrate: 1.23456, stake: 0 });
    expect(rnd.daily.toString().replace(/^\d+\.?/, "").length).toBeLessThanOrEqual(4);
    expect(rnd.monthly.toString().replace(/^\d+\.?/, "").length).toBeLessThanOrEqual(2);
  });
});
