import { describe, expect,it } from "vitest";

import { calculateRewards as rewardsCalc } from "../lib/mining-calc";
import {
  calculateRewards as rewardsLegacy,
  type MiningInput,
} from "../lib/mining-calculations";
import {
  calculateRewards as miningMathRewards,
  type MiningInput as MiningMathInput,
} from "../lib/mining-math";

/** Worker (`mining.worker.ts`) delegates to `mining-calc`; both TS modules must stay identical. */
const PARITY_CASES: MiningInput[] = [
  { adjustedHashrate: 0, stake: 0 },
  { adjustedHashrate: 1, stake: 0 },
  { adjustedHashrate: 10, stake: 0 },
  { adjustedHashrate: 10, stake: 5_000 },
  { adjustedHashrate: 10, stake: 10_000 },
  { adjustedHashrate: 100, stake: 0 },
  { adjustedHashrate: 100, stake: 1_000 },
  { adjustedHashrate: 100, stake: 5_000 },
  { adjustedHashrate: 50, stake: 2_500 },
  { adjustedHashrate: 50, stake: 5_000 },
  { adjustedHashrate: 1.23456, stake: 0 },
  { adjustedHashrate: 1_000_000, stake: 0 },
];

describe("mining rewards", () => {
  it("mining-calc ≡ mining-calculations; zeros, linearity, stake tiers, APY, rounding, refs", () => {
    for (const c of PARITY_CASES) {
      expect(rewardsLegacy(c), JSON.stringify(c)).toEqual(rewardsCalc(c));
    }

    const calc = rewardsCalc;

    const z = calc({ adjustedHashrate: 0, stake: 0 });
    expect(z.daily).toBe(0);
    expect(z.monthly).toBe(0);
    expect(z.apy).toBe(15);

    expect(calc({ adjustedHashrate: 1, stake: 0 }).daily).toBe(0.0082);
    const ten = calc({ adjustedHashrate: 10, stake: 0 });
    expect(ten.daily).toBe(0.082);
    expect(ten.monthly).toBeCloseTo(ten.daily * 30, 2);
    expect(ten.apy).toBe(16);

    const r10 = calc({ adjustedHashrate: 10, stake: 0 });
    const r20 = calc({ adjustedHashrate: 20, stake: 0 });
    expect(r20.daily).toBeCloseTo(r10.daily * 2, 2);

    const noStake = calc({ adjustedHashrate: 10, stake: 0 });
    const maxStake = calc({ adjustedHashrate: 10, stake: 10_000 });
    expect(maxStake.daily).toBeCloseTo(noStake.daily * 2, 4);
    expect(calc({ adjustedHashrate: 10, stake: 5_000 }).daily).toBeCloseTo(
      10 * 0.0082 * 1.5,
      4,
    );

    const noStake100 = calc({ adjustedHashrate: 100, stake: 0 });
    expect(calc({ adjustedHashrate: 100, stake: 10_000 }).daily).toBeCloseTo(
      noStake100.daily * 2,
      2,
    );

    const mid = calc({ adjustedHashrate: 100, stake: 1_000 });
    expect(mid.monthly).toBeCloseTo(mid.daily * 30, 1);

    const baseApy = calc({ adjustedHashrate: 0, stake: 0 }).apy;
    expect(calc({ adjustedHashrate: 10, stake: 0 }).apy - baseApy).toBeCloseTo(1, 1);
    expect(calc({ adjustedHashrate: 0, stake: 1_000 }).apy - baseApy).toBeCloseTo(1, 1);
    const r100 = calc({ adjustedHashrate: 100, stake: 0 });
    const r200 = calc({ adjustedHashrate: 200, stake: 0 });
    expect(r200.apy - r100.apy).toBeCloseTo(10, 1);
    const r1k = calc({ adjustedHashrate: 0, stake: 1_000 });
    const r2k = calc({ adjustedHashrate: 0, stake: 2_000 });
    expect(r2k.apy - r1k.apy).toBeCloseTo(1, 1);
    expect(calc({ adjustedHashrate: 0, stake: 5_000 }).apy).toBe(20);
    expect(calc({ adjustedHashrate: 10, stake: 10_000 }).apy).toBe(26);
    expect(calc({ adjustedHashrate: 50, stake: 5_000 }).apy).toBeCloseTo(25, 1);

    const ref: MiningInput = { adjustedHashrate: 100, stake: 5_000 };
    const refR = calc(ref);
    expect(refR.daily).toBe(1.23);
    expect(refR.monthly).toBe(36.9);
    expect(refR.apy).toBe(30);

    const scen = calc({ adjustedHashrate: 50, stake: 2_500 });
    expect(scen.daily).toBe(0.5125);
    expect(scen.monthly).toBe(15.38);
    expect(scen.apy).toBe(22.5);

    const real = calc({ adjustedHashrate: 50, stake: 5_000 });
    expect(real.daily).toBeGreaterThan(0);
    expect(real.monthly).toBeGreaterThan(0);
    expect(real.apy).toBeGreaterThan(0);

    const big = calc({ adjustedHashrate: 1_000_000, stake: 0 });
    expect(big.daily).toBeGreaterThan(0);
    expect(Number.isFinite(big.apy)).toBe(true);

    const prec = calc({ adjustedHashrate: 7, stake: 3_500 });
    expect((prec.daily.toString().split(".")[1] ?? "").length).toBeLessThanOrEqual(4);
    expect((prec.monthly.toString().split(".")[1] ?? "").length).toBeLessThanOrEqual(2);
    expect((prec.apy.toString().split(".")[1] ?? "").length).toBeLessThanOrEqual(1);

    const rnd = calc({ adjustedHashrate: 1.23456, stake: 0 });
    expect(rnd.daily.toString().replace(/^\d+\.?/, "").length).toBeLessThanOrEqual(4);
    expect(rnd.monthly.toString().replace(/^\d+\.?/, "").length).toBeLessThanOrEqual(2);
    const apyDec = calc({ adjustedHashrate: 1.5, stake: 500 });
    expect((apyDec.apy.toString().split(".")[1] ?? "").length).toBeLessThanOrEqual(1);
  });
});

describe("mining-math module", () => {
  it("≡ mining-calc + shape, monotonicity, device profiles", () => {
    for (const c of PARITY_CASES) {
      expect(miningMathRewards(c as MiningMathInput), JSON.stringify(c)).toEqual(
        rewardsCalc(c),
      );
    }

    const a = miningMathRewards({ adjustedHashrate: 1, stake: 0 });
    expect(a).toHaveProperty("daily");
    expect(a).toHaveProperty("monthly");
    expect(a).toHaveProperty("apy");

    const inputs: MiningMathInput[] = [
      { adjustedHashrate: 0.5, stake: 0 },
      { adjustedHashrate: 2.5, stake: 0 },
      { adjustedHashrate: 8.0, stake: 0 },
      { adjustedHashrate: 50.0, stake: 0 },
    ];
    const dailies = inputs.map((i) => miningMathRewards(i).daily);
    for (let i = 1; i < dailies.length; i++) {
      expect(dailies[i]).toBeGreaterThan(dailies[i - 1]);
    }

    const profiles = [
      { device: "smartphone", hashrate: 0.5 * 0.8, stake: 0 },
      { device: "laptop", hashrate: 2.5 * 0.9, stake: 0 },
      { device: "desktop", hashrate: 8.0 * 1.0, stake: 0 },
      { device: "node", hashrate: 50.0 * 1.2, stake: 0 },
    ];
    profiles.forEach(({ device, hashrate, stake }) => {
      const result = miningMathRewards({ adjustedHashrate: hashrate, stake });
      expect(result.daily, `${device} daily should be > 0`).toBeGreaterThan(0);
    });
    const phone = miningMathRewards({ adjustedHashrate: 0.5 * 0.8, stake: 0 });
    const node = miningMathRewards({ adjustedHashrate: 50.0 * 1.2, stake: 0 });
    expect(node.daily / phone.daily).toBeGreaterThan(100);
  });
});
