import { describe, it, expect } from "vitest";
import { cn, formatNumber, formatTokenAmount } from "../lib/utils";

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

describe("formatNumber", () => {
  it("formats an integer with no decimals by default", () => {
    expect(formatNumber(9000)).toBe("9,000");
  });

  it("formats zero", () => {
    expect(formatNumber(0)).toBe("0");
  });

  it("formats a negative number", () => {
    expect(formatNumber(-1500)).toBe("-1,500");
  });

  it("formats with specified decimal places", () => {
    expect(formatNumber(1234.5, 2)).toBe("1,234.50");
  });

  it("pads trailing zeros to reach the requested decimal places", () => {
    expect(formatNumber(1, 3)).toBe("1.000");
  });

  it("rounds to the specified decimal places", () => {
    expect(formatNumber(1.23456, 2)).toBe("1.23");
  });

  it("accepts an explicit locale", () => {
    // en-US uses comma thousands separator — just ensure it runs without error
    const result = formatNumber(1000, 0, "en-US");
    expect(result).toBe("1,000");
  });
});

describe("formatTokenAmount", () => {
  it("formats values below 1 000 without a suffix", () => {
    expect(formatTokenAmount(500)).toBe("500.00");
  });

  it("returns '—' for non-finite values", () => {
    expect(formatTokenAmount(Infinity)).toBe("—");
    expect(formatTokenAmount(NaN)).toBe("—");
    expect(formatTokenAmount(-Infinity)).toBe("—");
  });

  it("formats values below 1 000 with decimals", () => {
    expect(formatTokenAmount(500, 2)).toBe("500.00");
  });

  it("formats values in the thousands range with a K suffix", () => {
    expect(formatTokenAmount(2500)).toBe("2.5K");
  });

  it("omits the decimal for whole-number K values", () => {
    expect(formatTokenAmount(3000)).toBe("3K");
  });

  it("formats 9 000 (the CET total supply) as compact K notation", () => {
    expect(formatTokenAmount(9000)).toBe("9K");
  });

  it("formats values in the millions range with an M suffix", () => {
    expect(formatTokenAmount(1_500_000, 2)).toBe("1.50M");
  });

  it("formats exactly 1 000 000 as 1.00M", () => {
    expect(formatTokenAmount(1_000_000, 2)).toBe("1.00M");
  });

  it("handles zero", () => {
    expect(formatTokenAmount(0)).toBe("0.00");
  });
});
