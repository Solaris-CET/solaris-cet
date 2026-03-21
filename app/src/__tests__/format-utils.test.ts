import { describe, it, expect } from "vitest";
import { formatNumber, formatCurrency, formatPercentage, clamp } from "../lib/utils";

describe("formatNumber", () => {
  it("formats an integer with 2 decimal places by default", () => {
    expect(formatNumber(9000)).toBe("9,000.00");
  });

  it("uses thousands separator", () => {
    expect(formatNumber(1_000_000)).toBe("1,000,000.00");
  });

  it("respects custom decimal places", () => {
    expect(formatNumber(1234.5, 0)).toBe("1,235");
    expect(formatNumber(0.0082, 4)).toBe("0.0082");
  });

  it("formats zero correctly", () => {
    expect(formatNumber(0)).toBe("0.00");
    expect(formatNumber(0, 0)).toBe("0");
  });

  it("formats negative numbers", () => {
    expect(formatNumber(-42.5, 1)).toBe("-42.5");
  });
});

describe("formatCurrency", () => {
  it("formats a value with the dollar sign and 2 decimal places", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
  });

  it("formats zero as $0.00", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("respects custom decimal places", () => {
    expect(formatCurrency(0.00082, 5)).toBe("$0.00082");
  });

  it("formats large values with thousands separators", () => {
    expect(formatCurrency(9000)).toBe("$9,000.00");
  });
});

describe("formatPercentage", () => {
  it("appends a percent sign", () => {
    expect(formatPercentage(15.5)).toBe("15.50%");
  });

  it("respects custom decimal places", () => {
    expect(formatPercentage(100, 0)).toBe("100%");
  });

  it("formats zero as '0.00%'", () => {
    expect(formatPercentage(0)).toBe("0.00%");
  });
});

describe("clamp", () => {
  it("returns the value when within bounds", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps to min when value is below min", () => {
    expect(clamp(-1, 0, 10)).toBe(0);
  });

  it("clamps to max when value exceeds max", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("handles equal min and max", () => {
    expect(clamp(7, 5, 5)).toBe(5);
  });

  it("returns min when value equals min", () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it("returns max when value equals max", () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });
});
