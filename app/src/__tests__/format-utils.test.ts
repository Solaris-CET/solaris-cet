import { describe, expect,it } from "vitest";

import { formatCurrency, formatNumber, formatPercentage } from "../lib/utils";

describe("formatNumber, formatCurrency, formatPercentage", () => {
  it("separators, $, %", () => {
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
  });
});
