import { describe, it, expect } from "vitest";
import { formatNumber, formatCurrency, formatPercentage } from "../lib/utils";

// clamp: see utils.test.ts (single source of truth)

describe("formatNumber", () => {
  it("separators, decimals, zero, negatives", () => {
    expect(formatNumber(9000)).toBe("9,000.00");
    expect(formatNumber(1_000_000)).toBe("1,000,000.00");
    expect(formatNumber(1234.5, 0)).toBe("1,235");
    expect(formatNumber(0.0082, 4)).toBe("0.0082");
    expect(formatNumber(0)).toBe("0.00");
    expect(formatNumber(0, 0)).toBe("0");
    expect(formatNumber(-42.5, 1)).toBe("-42.5");
  });
});

describe("formatCurrency", () => {
  it("$ prefix, decimals, large values", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
    expect(formatCurrency(0)).toBe("$0.00");
    expect(formatCurrency(0.00082, 5)).toBe("$0.00082");
    expect(formatCurrency(9000)).toBe("$9,000.00");
  });
});

describe("formatPercentage", () => {
  it("suffix and decimal control", () => {
    expect(formatPercentage(15.5)).toBe("15.50%");
    expect(formatPercentage(100, 0)).toBe("100%");
    expect(formatPercentage(0)).toBe("0.00%");
  });
});
