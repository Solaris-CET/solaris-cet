import { describe, it, expect } from "vitest";
import { cn, formatUsd, formatPrice, clamp, debounce } from "../lib/utils";

describe("lib/utils", () => {
  it("cn, formatUsd, formatPrice, clamp", () => {
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
  });

  it("debounce coalesces and forwards args", async () => {
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
  });
});
