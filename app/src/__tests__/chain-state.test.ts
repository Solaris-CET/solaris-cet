import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type {
  ChainState,
  ChainTokenState,
  ChainPoolState,
} from "../lib/chain-state";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeToken(overrides: Partial<ChainTokenState> = {}): ChainTokenState {
  return {
    symbol: "CET",
    name: "Cetățuia Ecosystem Token",
    contract: "EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX",
    totalSupply: "9000.000000000",
    decimals: 9,
    ...overrides,
  };
}

function makePool(overrides: Partial<ChainPoolState> = {}): ChainPoolState {
  return {
    address: "EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB",
    reserveTon: "1000.000000000",
    reserveCet: "4500.000000000",
    lpSupply: "2121.320343560",
    priceTonPerCet: "0.222222222",
    ...overrides,
  };
}

function makeChainState(overrides: Partial<ChainState> = {}): ChainState {
  return {
    token: makeToken(),
    pool: makePool(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Type-shape tests (pure TypeScript / data-structure assertions)
// ---------------------------------------------------------------------------

describe("ChainTokenState shape", () => {
  it("accepts a fully populated token", () => {
    const token = makeToken();
    expect(token.symbol).toBe("CET");
    expect(token.decimals).toBe(9);
    expect(token.totalSupply).not.toBeNull();
  });

  it("allows totalSupply to be null (unknown state)", () => {
    const token = makeToken({ totalSupply: null });
    expect(token.totalSupply).toBeNull();
  });

  it("contract address is a non-empty string", () => {
    const token = makeToken();
    expect(typeof token.contract).toBe("string");
    expect(token.contract.length).toBeGreaterThan(0);
  });
});

describe("ChainPoolState shape", () => {
  it("accepts a fully populated pool", () => {
    const pool = makePool();
    expect(pool.address).toBeTruthy();
    expect(pool.reserveTon).not.toBeNull();
    expect(pool.reserveCet).not.toBeNull();
    expect(pool.lpSupply).not.toBeNull();
    expect(pool.priceTonPerCet).not.toBeNull();
  });

  it("allows all nullable fields to be null (unknown state)", () => {
    const pool = makePool({
      reserveTon: null,
      reserveCet: null,
      lpSupply: null,
      priceTonPerCet: null,
    });
    expect(pool.reserveTon).toBeNull();
    expect(pool.reserveCet).toBeNull();
    expect(pool.lpSupply).toBeNull();
    expect(pool.priceTonPerCet).toBeNull();
  });

  it("pool address matches the known DeDust pool", () => {
    const pool = makePool();
    expect(pool.address).toBe(
      "EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB"
    );
  });
});

describe("ChainState shape", () => {
  it("includes token, pool, and updatedAt", () => {
    const state = makeChainState();
    expect(state.token).toBeDefined();
    expect(state.pool).toBeDefined();
    expect(typeof state.updatedAt).toBe("string");
  });

  it("updatedAt is a valid ISO 8601 date string", () => {
    const state = makeChainState();
    const parsed = new Date(state.updatedAt);
    expect(Number.isNaN(parsed.getTime())).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// fetchChainState — tested by mocking globalThis.fetch
// ---------------------------------------------------------------------------

describe("fetchChainState (via module re-import with mocked fetch)", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    // Reset the module registry so the module-level promise is re-evaluated
    vi.resetModules();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.resetModules();
  });

  it("resolves with a valid ChainState on a successful fetch", async () => {
    const mockState = makeChainState();
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockState,
    } as unknown as Response);

    const { chainStatePromise } = await import("../lib/chain-state");
    const result = await chainStatePromise;

    expect(result.token.symbol).toBe("CET");
    expect(result.pool.address).toBe(
      "EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB"
    );
    expect(typeof result.updatedAt).toBe("string");
  });

  it("rejects when the response status is not ok", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({}),
    } as unknown as Response);

    const { chainStatePromise } = await import("../lib/chain-state");

    await expect(chainStatePromise).rejects.toThrow(
      "Failed to fetch chain state: 404"
    );
  });

  it("rejects when fetch itself throws a network error", async () => {
    globalThis.fetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Network request failed"));

    const { chainStatePromise } = await import("../lib/chain-state");

    await expect(chainStatePromise).rejects.toThrow("Network request failed");
  });
});
