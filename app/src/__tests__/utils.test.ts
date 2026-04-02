import { describe, it, expect } from "vitest";
import { cn, formatUsd, formatPrice, clamp, debounce } from "../lib/utils";

describe("cn (class name utility)", () => {
  it("empty, merge, falsy, tailwind-merge, object, array", () => {
    expect(cn()).toBe("");
    expect(cn("foo")).toBe("foo");
    expect(cn("foo", "bar")).toBe("foo bar");
    expect(cn("foo", false, null, undefined, 0, "", "bar")).toBe("foo bar");
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm text-lg", "font-bold")).toBe("text-lg font-bold");
    expect(cn({ "bg-red-500": true, "text-white": false })).toBe("bg-red-500");
    expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz");
  });
});

// ---------------------------------------------------------------------------
// formatUsd
// ---------------------------------------------------------------------------
describe("formatUsd", () => {
  it("returns '—' for null, undefined, NaN, Infinity", () => {
    for (const v of [null, undefined, NaN, Infinity] as const) {
      expect(formatUsd(v)).toBe("—");
    }
  });

  it("formats millions with M suffix", () => {
    expect(formatUsd(1_234_567)).toBe("$1.23M");
    expect(formatUsd(10_000_000)).toBe("$10.00M");
  });

  it("formats thousands with K suffix", () => {
    expect(formatUsd(5_678)).toBe("$5.68K");
    expect(formatUsd(1_000)).toBe("$1.00K");
  });

  it("formats small values with 4 decimal places", () => {
    expect(formatUsd(0.0042)).toBe("$0.0042");
    expect(formatUsd(3.14)).toBe("$3.1400");
  });

  it("handles exactly 1 000 000", () => {
    expect(formatUsd(1_000_000)).toBe("$1.00M");
  });

  it("handles zero", () => {
    expect(formatUsd(0)).toBe("$0.0000");
  });
});

// ---------------------------------------------------------------------------
// formatPrice
// ---------------------------------------------------------------------------
describe("formatPrice", () => {
  it("returns '—' for null, undefined, NaN", () => {
    for (const v of [null, undefined, NaN] as const) {
      expect(formatPrice(v)).toBe("—");
    }
  });

  it("exponential below 0.001, fixed at 0.001, normal decimals", () => {
    for (const n of [0.00042, 0.0009] as const) {
      const result = formatPrice(n);
      expect(result).toMatch(/^\$/);
      expect(result).toContain("e");
    }
    expect(formatPrice(0.001)).toBe("$0.0010");
    expect(formatPrice(3.1415)).toBe("$3.1415");
    expect(formatPrice(100)).toBe("$100.0000");
  });
});

// ---------------------------------------------------------------------------
// clamp
// ---------------------------------------------------------------------------
describe("clamp", () => {
  it("in-range, edges, floats, negative ranges", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
    expect(clamp(0.5, 0.1, 0.9)).toBe(0.5);
    expect(clamp(1.5, 0.1, 0.9)).toBe(0.9);
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(0, -10, -1)).toBe(-1);
  });
});

// ---------------------------------------------------------------------------
// debounce
// ---------------------------------------------------------------------------
describe("debounce", () => {
  it("coalesces calls, last wins, forwards args", async () => {
    let callCount = 0;
    const fn1 = debounce(() => {
      callCount++;
    }, 50);
    fn1();
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
    fn2("b");
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
