import { describe, it, expect } from "vitest";
import { truncateAddress, formatTokenAmount } from "../lib/utils";

// ── truncateAddress ──────────────────────────────────────────────────────────

describe("truncateAddress", () => {
  const POOL = "EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB";

  it("truncates a long address with default chars=4", () => {
    expect(truncateAddress(POOL)).toBe("EQB5…lfnB");
  });

  it("truncates with a custom chars value", () => {
    expect(truncateAddress(POOL, 6)).toBe("EQB5_h…IelfnB");
  });

  it("returns the original address when it is too short to truncate", () => {
    // length (9) == chars*2+1 (9) → no truncation
    expect(truncateAddress("ABCDEFGHI", 4)).toBe("ABCDEFGHI");
  });

  it("truncates an address that is one character over the boundary", () => {
    // length (10) > chars*2+1 (9) → truncates
    expect(truncateAddress("ABCDEFGHIJ", 4)).toBe("ABCD…GHIJ");
  });

  it("handles an empty string gracefully", () => {
    expect(truncateAddress("", 4)).toBe("");
  });
});

// ── formatTokenAmount ────────────────────────────────────────────────────────

describe("formatTokenAmount", () => {
  it("formats a typical CET supply string", () => {
    expect(formatTokenAmount("9000.000000000")).toBe("9,000.00");
  });

  it("returns '—' for null input", () => {
    expect(formatTokenAmount(null)).toBe("—");
  });

  it("returns '—' for non-numeric string", () => {
    expect(formatTokenAmount("not-a-number")).toBe("—");
  });

  it("uses the provided decimals count", () => {
    expect(formatTokenAmount("1234.5678", 4)).toBe("1,234.5678");
  });

  it("rounds to the given decimal places", () => {
    expect(formatTokenAmount("1234.5699", 2)).toBe("1,234.57");
  });

  it("formats zero", () => {
    expect(formatTokenAmount("0")).toBe("0.00");
  });
});
