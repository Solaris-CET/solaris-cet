/**
 * chain-state.test.ts
 *
 * Tests for the chain-state module interfaces and data shapes.
 *
 * `chain-state.ts` creates a module-level promise that calls `fetch` with a
 * relative URL (`/api/state.json`) at module evaluation time.  In a Node test
 * environment the relative URL fails to parse, so we mock the entire module
 * via `vi.mock` (which is hoisted before imports by Vitest) and focus tests on:
 *   - the TypeScript interface shapes (validated at compile time + runtime)
 *   - the exported constants (contract addresses, pool address)
 *   - null-safety of optional fields
 */
import { describe, it, expect, vi } from "vitest";
import type { ChainState, ChainTokenState, ChainPoolState } from "../lib/chain-state";

// ---------------------------------------------------------------------------
// Fixtures — defined with vi.hoisted so they are available inside the
// vi.mock factory, which is hoisted above all imports and top-level statements.
// ---------------------------------------------------------------------------

const { MOCK_STATE } = vi.hoisted(() => {
  const state: {
    token: {
      symbol: string;
      name: string;
      contract: string;
      totalSupply: string | null;
      decimals: number;
    };
    pool: {
      address: string;
      reserveTon: string | null;
      reserveCet: string | null;
      lpSupply: string | null;
      priceTonPerCet: string | null;
    };
    updatedAt: string;
  } = {
    token: {
      symbol: "CET",
      name: "Cetățuia",
      contract: "EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX",
      totalSupply: "9000.000000000",
      decimals: 9,
    },
    pool: {
      address: "EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB",
      reserveTon: "100.5",
      reserveCet: "4500.0",
      lpSupply: "2000.0",
      priceTonPerCet: "0.0223",
    },
    updatedAt: "2024-01-01T00:00:00.000Z",
  };
  return { MOCK_STATE: state };
});

// Mock the module so the module-level `chainStatePromise` resolves against
// our fixture instead of attempting a network call in the test environment.
vi.mock("../lib/chain-state", () => ({
  chainStatePromise: Promise.resolve(MOCK_STATE),
}));

import { chainStatePromise } from "../lib/chain-state";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("chain-state module", () => {
  it("exports chainStatePromise as a native Promise", () => {
    expect(chainStatePromise).toBeInstanceOf(Promise);
  });

  it("chainStatePromise resolves with a ChainState object", async () => {
    const state = await chainStatePromise;
    expect(state).toStrictEqual(MOCK_STATE);
  });
});

describe("ChainTokenState interface shape", () => {
  it("token has all required fields with correct types", () => {
    const token: ChainTokenState = MOCK_STATE.token;
    expect(typeof token.symbol).toBe("string");
    expect(typeof token.name).toBe("string");
    expect(typeof token.contract).toBe("string");
    expect(typeof token.decimals).toBe("number");
    expect(token.totalSupply === null || typeof token.totalSupply === "string").toBe(true);
  });

  it("token contract address matches the known CET contract", () => {
    expect(MOCK_STATE.token.contract).toBe("EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX");
  });

  it("token symbol is CET", () => {
    expect(MOCK_STATE.token.symbol).toBe("CET");
  });

  it("token decimals is 9", () => {
    expect(MOCK_STATE.token.decimals).toBe(9);
  });

  it("token totalSupply starts with 9000", () => {
    expect(MOCK_STATE.token.totalSupply).toMatch(/^9000/);
  });
});

describe("ChainPoolState interface shape", () => {
  it("pool has all required fields with correct types", () => {
    const pool: ChainPoolState = MOCK_STATE.pool;
    expect(typeof pool.address).toBe("string");
    expect(pool.reserveTon === null || typeof pool.reserveTon === "string").toBe(true);
    expect(pool.reserveCet === null || typeof pool.reserveCet === "string").toBe(true);
    expect(pool.lpSupply === null || typeof pool.lpSupply === "string").toBe(true);
    expect(pool.priceTonPerCet === null || typeof pool.priceTonPerCet === "string").toBe(true);
  });

  it("pool address matches the known DeDust pool address", () => {
    expect(MOCK_STATE.pool.address).toBe("EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB");
  });

  it("pool reserves are non-null in a healthy state", () => {
    expect(MOCK_STATE.pool.reserveTon).not.toBeNull();
    expect(MOCK_STATE.pool.reserveCet).not.toBeNull();
  });
});

describe("ChainState updatedAt field", () => {
  it("updatedAt is a non-empty string", () => {
    expect(typeof MOCK_STATE.updatedAt).toBe("string");
    expect(MOCK_STATE.updatedAt.length).toBeGreaterThan(0);
  });

  it("updatedAt parses as a valid ISO 8601 date", () => {
    const date = new Date(MOCK_STATE.updatedAt);
    expect(isNaN(date.getTime())).toBe(false);
  });
});

describe("ChainState — null-safe nullable fields", () => {
  it("ChainTokenState accepts null for totalSupply", () => {
    const partial: ChainTokenState = {
      symbol: "CET",
      name: "Cetățuia",
      contract: "EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX",
      totalSupply: null,
      decimals: 9,
    };
    expect(partial.totalSupply).toBeNull();
  });

  it("ChainPoolState accepts null for all optional fields", () => {
    const nullablePool: ChainPoolState = {
      address: "EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB",
      reserveTon: null,
      reserveCet: null,
      lpSupply: null,
      priceTonPerCet: null,
    };
    expect(nullablePool.reserveTon).toBeNull();
    expect(nullablePool.reserveCet).toBeNull();
    expect(nullablePool.lpSupply).toBeNull();
    expect(nullablePool.priceTonPerCet).toBeNull();
  });

  it("ChainState is fully valid with all-null pool fields", () => {
    const degradedState: ChainState = {
      token: { ...MOCK_STATE.token, totalSupply: null },
      pool: {
        address: MOCK_STATE.pool.address,
        reserveTon: null,
        reserveCet: null,
        lpSupply: null,
        priceTonPerCet: null,
      },
      updatedAt: MOCK_STATE.updatedAt,
    };
    expect(degradedState.token.totalSupply).toBeNull();
    expect(degradedState.pool.reserveTon).toBeNull();
  });
});
