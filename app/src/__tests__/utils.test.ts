import { describe, expect,it } from "vitest";

import { DEDUST_POOL_ADDRESS } from "@/lib/dedustUrls";

import {
  clamp,
  cn,
  debounce,
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatPrice,
  formatTokenAmount,
  formatUsd,
  truncateAddress,
} from "../lib/utils";

describe("lib/utils", () => {
  it("cn, money helpers, clamp, debounce, formatNumber/Currency/Percentage, truncateAddress, formatTokenAmount", async () => {
    expect(cn()).toBe("");
    expect(cn("foo", "bar")).toBe("foo bar");
    expect(cn("foo", false, null, undefined, 0, "", "bar")).toBe("foo bar");
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm text-lg", "font-bold")).toBe("text-lg font-bold");
    expect(cn({ "bg-red-500": true, "text-white": false })).toBe("bg-red-500");
    expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz");

    for (const v of [null, undefined, NaN, Infinity] as const) {
      expect(formatUsd(v)).toBe("—");
    }
    expect(formatUsd(1_234_567)).toBe("$1.23M");
    expect(formatUsd(5_678)).toBe("$5.68K");
    expect(formatUsd(0)).toBe("$0.0000");

    for (const v of [null, undefined, NaN] as const) {
      expect(formatPrice(v)).toBe("—");
    }
    for (const n of [0.00042, 0.0009] as const) {
      const r = formatPrice(n);
      expect(r).toMatch(/^\$/);
      expect(r).toContain("e");
    }
    expect(formatPrice(0.001)).toBe("$0.0010");

    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(0, -10, -1)).toBe(-1);

    let callCount = 0;
    const fn1 = debounce(() => {
      callCount++;
    }, 50);
    fn1();
    fn1();
    expect(callCount).toBe(0);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(callCount).toBe(1);

    const calls: string[] = [];
    const fn2 = debounce((label: string) => {
      calls.push(label);
    }, 50);
    fn2("a");
    fn2("c");
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(calls).toEqual(["c"]);

    let received: number[] = [];
    const fn3 = debounce((...args: number[]) => {
      received = args;
    }, 30);
    fn3(1, 2, 3);
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(received).toEqual([1, 2, 3]);

    expect(formatNumber(9000)).toBe("9,000.00");
    expect(formatNumber(1_000_000)).toBe("1,000,000.00");
    expect(formatNumber(1234.5, 0)).toBe("1,235");
    expect(formatNumber(0.0082, 4)).toBe("0.0082");
    expect(formatNumber(0)).toBe("0.00");
    expect(formatNumber(0, 0)).toBe("0");
    expect(formatNumber(-42.5, 1)).toBe("-42.5");

    expect(formatCurrency(1234.5)).toBe("$1,234.50");
    expect(formatCurrency(0)).toBe("$0.00");
    expect(formatCurrency(0.00082, 5)).toBe("$0.00082");
    expect(formatCurrency(9000)).toBe("$9,000.00");

    expect(formatPercentage(15.5)).toBe("15.50%");
    expect(formatPercentage(100, 0)).toBe("100%");
    expect(formatPercentage(0)).toBe("0.00%");

    const POOL = DEDUST_POOL_ADDRESS;
    expect(truncateAddress(POOL)).toBe("EQB5…lfnB");
    expect(truncateAddress(POOL, 6)).toBe("EQB5_h…IelfnB");
    expect(truncateAddress("ABCDEFGHI", 4)).toBe("ABCDEFGHI");
    expect(truncateAddress("ABCDEFGHIJ", 4)).toBe("ABCD…GHIJ");
    expect(truncateAddress("", 4)).toBe("");

    expect(formatTokenAmount("9000.000000000")).toBe("9,000.00");
    expect(formatTokenAmount(null)).toBe("—");
    expect(formatTokenAmount("not-a-number")).toBe("—");
    expect(formatTokenAmount("1234.5678", 4)).toBe("1,234.5678");
    expect(formatTokenAmount("1234.5699", 2)).toBe("1,234.57");
    expect(formatTokenAmount("0")).toBe("0.00");
  });
});
