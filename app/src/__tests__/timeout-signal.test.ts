import { describe, it, expect, vi, afterEach } from "vitest";
import { createTimeoutSignal } from "../hooks/use-live-pool-data";

describe("createTimeoutSignal", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns an AbortSignal", () => {
    const signal = createTimeoutSignal(5000);
    expect(signal).toBeInstanceOf(AbortSignal);
  });

  it("signal is not aborted immediately", () => {
    const signal = createTimeoutSignal(5000);
    expect(signal.aborted).toBe(false);
  });

  it("uses AbortSignal.timeout when available", () => {
    const spy = vi.spyOn(AbortSignal, "timeout");
    createTimeoutSignal(1000);
    expect(spy).toHaveBeenCalledWith(1000);
  });

  it("falls back to AbortController when AbortSignal.timeout is unavailable", () => {
    // Temporarily hide AbortSignal.timeout to simulate an older browser
    const original = AbortSignal.timeout;
    // @ts-expect-error — intentionally removing the property to test the fallback
    delete AbortSignal.timeout;
    try {
      const signal = createTimeoutSignal(100);
      expect(signal).toBeInstanceOf(AbortSignal);
    } finally {
      AbortSignal.timeout = original;
    }
  });
});
