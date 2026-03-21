import { describe, it, expect } from "vitest";
import { cn, formatUsd, formatPrice, clamp, debounce } from "../lib/utils";

describe("cn (class name utility)", () => {
  it("returns an empty string when called with no arguments", () => {
    expect(cn()).toBe("");
  });

  it("merges a single class string unchanged", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("merges multiple class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("omits falsy values (false, null, undefined, 0, empty string)", () => {
    expect(cn("foo", false, null, undefined, 0, "", "bar")).toBe("foo bar");
  });

  it("resolves Tailwind conflicts — later class wins", () => {
    // tailwind-merge should keep only p-4 and discard p-2
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("resolves multiple Tailwind conflicts in one call", () => {
    expect(cn("text-sm text-lg", "font-bold")).toBe("text-lg font-bold");
  });

  it("handles conditional classes via object syntax", () => {
    expect(cn({ "bg-red-500": true, "text-white": false })).toBe("bg-red-500");
  });

  it("handles arrays of class values", () => {
    expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz");
  });
});

// ---------------------------------------------------------------------------
// formatUsd
// ---------------------------------------------------------------------------
describe("formatUsd", () => {
  it("returns '—' for null", () => {
    expect(formatUsd(null)).toBe("—");
  });

  it("returns '—' for undefined", () => {
    expect(formatUsd(undefined)).toBe("—");
  });

  it("returns '—' for NaN", () => {
    expect(formatUsd(NaN)).toBe("—");
  });

  it("returns '—' for Infinity", () => {
    expect(formatUsd(Infinity)).toBe("—");
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
  it("returns '—' for null", () => {
    expect(formatPrice(null)).toBe("—");
  });

  it("returns '—' for undefined", () => {
    expect(formatPrice(undefined)).toBe("—");
  });

  it("returns '—' for NaN", () => {
    expect(formatPrice(NaN)).toBe("—");
  });

  it("uses exponential notation for values < 0.001", () => {
    const result = formatPrice(0.00042);
    expect(result).toMatch(/^\$/);
    expect(result).toContain("e");
  });

  it("formats normal prices with 4 decimal places", () => {
    expect(formatPrice(3.1415)).toBe("$3.1415");
    expect(formatPrice(100)).toBe("$100.0000");
  });

  it("uses exponential for exactly 0.0009", () => {
    const result = formatPrice(0.0009);
    expect(result).toMatch(/^\$/);
    expect(result).toContain("e");
  });

  it("does not use exponential for exactly 0.001", () => {
    expect(formatPrice(0.001)).toBe("$0.0010");
  });
});

// ---------------------------------------------------------------------------
// clamp
// ---------------------------------------------------------------------------
describe("clamp", () => {
  it("returns the value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps to minimum when value is below range", () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });

  it("clamps to maximum when value is above range", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("returns min when value equals min", () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it("returns max when value equals max", () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it("works with floating-point bounds", () => {
    expect(clamp(0.5, 0.1, 0.9)).toBe(0.5);
    expect(clamp(1.5, 0.1, 0.9)).toBe(0.9);
  });

  it("works with negative ranges", () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(0, -10, -1)).toBe(-1);
  });
});

// ---------------------------------------------------------------------------
// debounce
// ---------------------------------------------------------------------------
describe("debounce", () => {
  it("delays the function call", async () => {
    let callCount = 0;
    const fn = debounce(() => { callCount++; }, 50);

    fn();
    fn();
    fn();

    // Not yet called (within delay window)
    expect(callCount).toBe(0);

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(callCount).toBe(1);
  });

  it("resets the timer on each call — only the last call fires", async () => {
    const calls: string[] = [];
    const fn = debounce((label: string) => { calls.push(label); }, 50);

    fn("a");
    fn("b");
    fn("c");

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(calls).toEqual(["c"]);
  });

  it("passes arguments to the wrapped function", async () => {
    let received: number[] = [];
    const fn = debounce((...args: number[]) => { received = args; }, 30);

    fn(1, 2, 3);

    await new Promise(resolve => setTimeout(resolve, 80));
    expect(received).toEqual([1, 2, 3]);
  });
});
