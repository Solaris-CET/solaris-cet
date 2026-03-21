import { describe, it, expect } from "vitest";
import { calculateRewards, type MiningInput } from "../lib/mining-calculations";

describe("calculateRewards", () => {
  // ── Zero inputs ───────────────────────────────────────────────────────────

  it("returns zero rewards for zero hashrate and zero stake", () => {
    const result = calculateRewards({ adjustedHashrate: 0, stake: 0 });
    expect(result.daily).toBe(0);
    expect(result.monthly).toBe(0);
    expect(result.apy).toBe(15); // base APY is always ≥ 15 %
  });

  // ── Daily / monthly consistency ───────────────────────────────────────────

  it("monthly equals daily × 30", () => {
    const result = calculateRewards({ adjustedHashrate: 100, stake: 1000 });
    expect(result.monthly).toBeCloseTo(result.daily * 30, 1);
  });

  // ── Stake multiplier ──────────────────────────────────────────────────────

  it("stake of 10,000 doubles the daily reward compared to stake of 0", () => {
    const base = calculateRewards({ adjustedHashrate: 10, stake: 0 });
    const doubled = calculateRewards({ adjustedHashrate: 10, stake: 10_000 });
    expect(doubled.daily).toBeCloseTo(base.daily * 2, 3);
  });

  it("stake of 5,000 gives 1.5× daily reward (50 % boost)", () => {
    const base = calculateRewards({ adjustedHashrate: 10, stake: 0 });
    const boosted = calculateRewards({ adjustedHashrate: 10, stake: 5_000 });
    expect(boosted.daily).toBeCloseTo(base.daily * 1.5, 3);
  });

  // ── APY formula ───────────────────────────────────────────────────────────

  it("APY has a baseline of 15 % with zero hashrate and zero stake", () => {
    expect(calculateRewards({ adjustedHashrate: 0, stake: 0 }).apy).toBe(15);
  });

  it("APY increases by 0.1 % per TH/s", () => {
    const r100 = calculateRewards({ adjustedHashrate: 100, stake: 0 });
    const r200 = calculateRewards({ adjustedHashrate: 200, stake: 0 });
    expect(r200.apy - r100.apy).toBeCloseTo(10, 1); // 100 TH/s × 0.1 %
  });

  it("APY increases by 1 percentage point per 1,000 BTC-S staked", () => {
    const r1k = calculateRewards({ adjustedHashrate: 0, stake: 1_000 });
    const r2k = calculateRewards({ adjustedHashrate: 0, stake: 2_000 });
    // stake/1_000 contributes 1 per 1k BTC-S, so the difference is exactly 1
    expect(r2k.apy - r1k.apy).toBeCloseTo(1, 1);
  });

  // ── Output precision ─────────────────────────────────────────────────────

  it("daily is rounded to 4 decimal places", () => {
    const result = calculateRewards({ adjustedHashrate: 1, stake: 1 });
    const decimals = result.daily.toString().split(".")[1] ?? "";
    expect(decimals.length).toBeLessThanOrEqual(4);
  });

  it("monthly is rounded to 2 decimal places", () => {
    const result = calculateRewards({ adjustedHashrate: 1, stake: 1 });
    const decimals = result.monthly.toString().split(".")[1] ?? "";
    expect(decimals.length).toBeLessThanOrEqual(2);
  });

  it("APY is rounded to 1 decimal place", () => {
    const result = calculateRewards({ adjustedHashrate: 1, stake: 1 });
    const decimals = result.apy.toString().split(".")[1] ?? "";
    expect(decimals.length).toBeLessThanOrEqual(1);
  });

  // ── Concrete reference values ─────────────────────────────────────────────

  it("produces correct reference values for hashrate=100 stake=5000", () => {
    const input: MiningInput = { adjustedHashrate: 100, stake: 5_000 };
    const result = calculateRewards(input);
    // stakeMultiplier = 1 + 5000/10000 = 1.5
    // daily = 100 * 0.0082 * 1.5 = 1.23
    // monthly = 1.23 * 30 = 36.9
    // apy = 15 + 5000/1000 + 100*0.1 = 15 + 5 + 10 = 30
    expect(result.daily).toBe(1.23);
    expect(result.monthly).toBe(36.9);
    expect(result.apy).toBe(30);
  });

  // ── Edge: very large values ───────────────────────────────────────────────

  it("handles very large hashrate without overflow", () => {
    const result = calculateRewards({ adjustedHashrate: 1_000_000, stake: 0 });
    expect(result.daily).toBeGreaterThan(0);
    expect(Number.isFinite(result.apy)).toBe(true);
  });
});
