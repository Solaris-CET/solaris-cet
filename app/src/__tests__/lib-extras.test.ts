import { describe, it, expect } from "vitest";
import { DEDUST_POOL_ADDRESS } from "@/lib/dedustUrls";
import { truncateAddress, formatTokenAmount } from "../lib/utils";

describe("truncateAddress", () => {
  it("pool default, custom chars, short/long boundary, empty", () => {
    const POOL = DEDUST_POOL_ADDRESS;
    expect(truncateAddress(POOL)).toBe("EQB5…lfnB");
    expect(truncateAddress(POOL, 6)).toBe("EQB5_h…IelfnB");
    expect(truncateAddress("ABCDEFGHI", 4)).toBe("ABCDEFGHI");
    expect(truncateAddress("ABCDEFGHIJ", 4)).toBe("ABCD…GHIJ");
    expect(truncateAddress("", 4)).toBe("");
  });
});

describe("formatTokenAmount", () => {
  it("supply, invalid, decimals, rounding, zero", () => {
    expect(formatTokenAmount("9000.000000000")).toBe("9,000.00");
    expect(formatTokenAmount(null)).toBe("—");
    expect(formatTokenAmount("not-a-number")).toBe("—");
    expect(formatTokenAmount("1234.5678", 4)).toBe("1,234.5678");
    expect(formatTokenAmount("1234.5699", 2)).toBe("1,234.57");
    expect(formatTokenAmount("0")).toBe("0.00");
  });
});
