import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CET_CONTRACT_ADDRESS } from "@/lib/cetContract";
import { DEDUST_POOL_ADDRESS } from "@/lib/dedustUrls";
import type {
  ChainState,
  ChainTokenState,
  ChainPoolState,
} from "../lib/chain-state";

function makeToken(overrides: Partial<ChainTokenState> = {}): ChainTokenState {
  return {
    symbol: "CET",
    name: "Cetățuia Ecosystem Token",
    contract: CET_CONTRACT_ADDRESS,
    totalSupply: "9000.000000000",
    decimals: 9,
    ...overrides,
  };
}

function makePool(overrides: Partial<ChainPoolState> = {}): ChainPoolState {
  return {
    address: DEDUST_POOL_ADDRESS,
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

describe("chain-state", () => {
  it("makers, literals, EQ addresses, parseSupply, cetPriceInTon, display formatting", () => {
    const t = makeToken();
    expect(t.symbol).toBe("CET");
    expect(t.decimals).toBe(9);
    expect(makeToken({ totalSupply: null }).totalSupply).toBeNull();

    const p = makePool();
    expect(p.address).toBe(DEDUST_POOL_ADDRESS);
    const n = makePool({
      reserveTon: null,
      reserveCet: null,
      lpSupply: null,
      priceTonPerCet: null,
    });
    expect(n.reserveTon).toBeNull();

    const state = makeChainState();
    expect(state.token).toBeDefined();
    expect(Number.isNaN(new Date(state.updatedAt).getTime())).toBe(false);

    const lit: ChainState = {
      token: {
        symbol: "CET",
        name: "Solaris CET",
        contract: CET_CONTRACT_ADDRESS,
        totalSupply: "9000.000000000",
        decimals: 9,
      },
      pool: {
        address: DEDUST_POOL_ADDRESS,
        reserveTon: "100.5",
        reserveCet: "4500.0",
        lpSupply: "2121.0",
        priceTonPerCet: "0.02233",
      },
      updatedAt: "2026-03-22T00:00:00.000Z",
    };
    expect(lit.pool.address).toContain("EQB5");

    const TON_ADDRESS_RE = /^EQ[A-Za-z0-9_-]{46}$/;
    expect(CET_CONTRACT_ADDRESS).toMatch(TON_ADDRESS_RE);
    expect(DEDUST_POOL_ADDRESS).toMatch(TON_ADDRESS_RE);
    expect(CET_CONTRACT_ADDRESS).not.toBe(DEDUST_POOL_ADDRESS);

    function parseSupply(raw: string | null): number | null {
      if (raw === null) return null;
      const num = Number(raw);
      return Number.isFinite(num) ? num : null;
    }
    expect(parseSupply("9000.000000000")).toBe(9000);
    expect(parseSupply(null)).toBeNull();
    expect(parseSupply("not-a-number")).toBeNull();

    function cetPriceInTon(
      reserveTon: string | null,
      reserveCet: string | null,
    ): number | null {
      if (!reserveTon || !reserveCet) return null;
      const ton = Number(reserveTon);
      const cet = Number(reserveCet);
      if (!Number.isFinite(ton) || !Number.isFinite(cet) || cet === 0) return null;
      return ton / cet;
    }
    expect(cetPriceInTon("100", "4500")).toBeCloseTo(0.02222, 4);
    expect(cetPriceInTon("100", null)).toBeNull();
    expect(cetPriceInTon(null, "4500")).toBeNull();
    expect(cetPriceInTon("100", "0")).toBeNull();

    const priceTonPerCetNull: string | null = null;
    const displayNull = priceTonPerCetNull
      ? `${parseFloat(priceTonPerCetNull).toFixed(4)} TON`
      : "—";
    expect(displayNull).toBe("—");
    expect(`${parseFloat("0.012345").toFixed(4)} TON`).toBe("0.0123 TON");
    const formatted = parseFloat("9000.000000000").toLocaleString("en-US", {
      maximumFractionDigits: 2,
    });
    expect(formatted).toBe("9,000");
    const CET_DECIMALS = 9;
    expect(parseFloat("9000000000000") / 10 ** CET_DECIMALS).toBeCloseTo(9000, 5);
    expect(1_000_000_000 / 1e9).toBe(1);
    expect(500 * 3.5 * 2).toBe(3500);
  });

  describe("fetchChainState (mocked fetch + timers)", () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
      vi.useFakeTimers();
      vi.resetModules();
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
      vi.useRealTimers();
      vi.resetModules();
    });

    it("success, HTTP error retries, network error retries", async () => {
      const mockState = makeChainState();
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockState,
      } as unknown as Response);
      vi.resetModules();
      const okMod = await import("../lib/chain-state");
      const result = await okMod.chainStatePromise;
      expect(result.token.symbol).toBe("CET");

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({}),
      } as unknown as Response);
      vi.resetModules();
      const errMod = await import("../lib/chain-state");
      const httpAssert = expect(errMod.chainStatePromise).rejects.toThrow(
        "Failed to fetch chain state: 404",
      );
      await vi.runAllTimersAsync();
      await httpAssert;

      globalThis.fetch = vi
        .fn()
        .mockRejectedValue(new TypeError("Network request failed"));
      vi.resetModules();
      const netMod = await import("../lib/chain-state");
      const netAssert = expect(netMod.chainStatePromise).rejects.toThrow(
        "Network request failed",
      );
      await vi.runAllTimersAsync();
      await netAssert;
    });
  });
});
