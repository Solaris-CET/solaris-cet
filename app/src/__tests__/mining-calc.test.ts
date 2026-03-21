import { describe, it, expect } from "vitest";
import { calculateRewards } from "../lib/mining-calc";

describe("calculateRewards", () => {
  // ── Zero inputs ────────────────────────────────────────────────────────────

  it("returns zero daily and monthly rewards when hashrate is 0", () => {
    const result = calculateRewards({ adjustedHashrate: 0, stake: 0 });
    expect(result.daily).toBe(0);
    expect(result.monthly).toBe(0);
  });

  it("returns base APY of 15 when hashrate and stake are both 0", () => {
    const result = calculateRewards({ adjustedHashrate: 0, stake: 0 });
    expect(result.apy).toBe(15);
  });

  // ── Hashrate-only scaling ──────────────────────────────────────────────────

  it("scales daily reward linearly with hashrate (no stake)", () => {
    const r1 = calculateRewards({ adjustedHashrate: 10, stake: 0 });
    const r2 = calculateRewards({ adjustedHashrate: 20, stake: 0 });
    expect(r2.daily).toBeCloseTo(r1.daily * 2, 2);
  });

  it("computes the correct daily reward for 10 TH/s with no stake", () => {
    // daily = 10 × 0.0082 × (1 + 0/10000) = 0.082
    const result = calculateRewards({ adjustedHashrate: 10, stake: 0 });
    expect(result.daily).toBe(0.082);
  });

  it("computes monthly as daily × 30 for 10 TH/s with no stake", () => {
    const result = calculateRewards({ adjustedHashrate: 10, stake: 0 });
    expect(result.monthly).toBeCloseTo(result.daily * 30, 2);
  });

  // ── Stake multiplier ───────────────────────────────────────────────────────

  it("doubles daily reward when stake equals the maximum tier (10 000 BTC-S)", () => {
    const noStake = calculateRewards({ adjustedHashrate: 10, stake: 0 });
    const maxStake = calculateRewards({ adjustedHashrate: 10, stake: 10_000 });
    expect(maxStake.daily).toBeCloseTo(noStake.daily * 2, 4);
  });

  it("increases daily reward proportionally with stake", () => {
    const r5k = calculateRewards({ adjustedHashrate: 10, stake: 5_000 });
    // stake multiplier = 1 + 5000/10000 = 1.5
    expect(r5k.daily).toBeCloseTo(10 * 0.0082 * 1.5, 4);
  });

  // ── APY formula ────────────────────────────────────────────────────────────

  it("adds 0.1 % APY per TH/s of hashrate", () => {
    const base = calculateRewards({ adjustedHashrate: 0, stake: 0 }).apy;
    const withHash = calculateRewards({ adjustedHashrate: 10, stake: 0 }).apy;
    expect(withHash - base).toBeCloseTo(10 * 0.1, 1);
  });

  it("adds 1 % APY per 1 000 BTC-S staked", () => {
    const base = calculateRewards({ adjustedHashrate: 0, stake: 0 }).apy;
    const withStake = calculateRewards({ adjustedHashrate: 0, stake: 1_000 }).apy;
    expect(withStake - base).toBeCloseTo(1, 1);
  });

  it("combines hashrate and stake bonuses in APY correctly", () => {
    // apy = 15 + 5000/1000 + 50 × 0.1 = 15 + 5 + 5 = 25
    const result = calculateRewards({ adjustedHashrate: 50, stake: 5_000 });
    expect(result.apy).toBeCloseTo(25, 1);
  });

  // ── Output precision ───────────────────────────────────────────────────────

  it("rounds daily to 4 decimal places", () => {
    const result = calculateRewards({ adjustedHashrate: 7, stake: 3_500 });
    const decimals = result.daily.toString().split(".")[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(4);
  });

  it("rounds monthly to 2 decimal places", () => {
    const result = calculateRewards({ adjustedHashrate: 7, stake: 3_500 });
    const decimals = result.monthly.toString().split(".")[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(2);
  });

  it("rounds APY to 1 decimal place", () => {
    const result = calculateRewards({ adjustedHashrate: 7, stake: 3_500 });
    const decimals = result.apy.toString().split(".")[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(1);
  });
});
