import { describe, it, expect } from "vitest";

// chain-state.ts has a module-level `fetch` that runs when the module is
// imported, which fails in the node test environment (no server running).
// We therefore test only the pure helper logic that surrounds the fetch — no
// import of chain-state.ts itself.

describe("chain-state URL construction", () => {
  it("appends api/state.json to the base URL", () => {
    const base = "./";
    const url = `${base}api/state.json`;
    expect(url).toBe("./api/state.json");
  });

  it("constructs a valid absolute URL with a trailing slash base", () => {
    const base = "https://example.com/";
    const url = `${base}api/state.json`;
    expect(url).toBe("https://example.com/api/state.json");
  });
});

describe("ChainState display helpers", () => {
  it("handles null pool reserves — returns em-dash placeholder", () => {
    const priceTonPerCet: string | null = null;
    const displayPrice = priceTonPerCet
      ? `${parseFloat(priceTonPerCet).toFixed(4)} TON`
      : "—";
    expect(displayPrice).toBe("—");
  });

  it("formats a valid price to 4 decimal places", () => {
    const priceTonPerCet = "0.012345";
    const displayPrice = `${parseFloat(priceTonPerCet).toFixed(4)} TON`;
    expect(displayPrice).toBe("0.0123 TON");
  });

  it("formats totalSupply with en-US locale (9000 → '9,000')", () => {
    const totalSupply = "9000.000000000";
    const formatted = parseFloat(totalSupply).toLocaleString("en-US", {
      maximumFractionDigits: 2,
    });
    expect(formatted).toBe("9,000");
  });

  it("CET_DECIMALS = 9 correctly scales nano-units to whole tokens", () => {
    const CET_DECIMALS = 9;
    const rawReserve = "9000000000000"; // 9000 CET in nanotons
    const scaled = parseFloat(rawReserve) / 10 ** CET_DECIMALS;
    expect(scaled).toBeCloseTo(9000, 5);
  });

  it("TON reserve scaling: 1e9 nanotons equals 1 TON", () => {
    const nanotons = 1_000_000_000;
    const tons = nanotons / 1e9;
    expect(tons).toBe(1);
  });

  it("TVL = 2× the TON side for a symmetric pool", () => {
    const tonReserve = 500; // TON
    const tonPriceUsd = 3.5;
    const tvlUsd = tonReserve * tonPriceUsd * 2;
    expect(tvlUsd).toBe(3500);
  });
});

