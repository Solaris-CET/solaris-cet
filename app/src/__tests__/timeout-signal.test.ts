import { afterEach,describe, expect, it, vi } from "vitest";

import { createTimeoutSignal } from "../hooks/use-live-pool-data";

describe("createTimeoutSignal", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("AbortSignal shape, not aborted, timeout API or fallback", () => {
    const signal = createTimeoutSignal(5000);
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal.aborted).toBe(false);

    const spy = vi.spyOn(AbortSignal, "timeout");
    createTimeoutSignal(1000);
    expect(spy).toHaveBeenCalledWith(1000);

    const original = AbortSignal.timeout;
    // @ts-expect-error — intentionally removing the property to test the fallback
    delete AbortSignal.timeout;
    try {
      const fallback = createTimeoutSignal(100);
      expect(fallback).toBeInstanceOf(AbortSignal);
    } finally {
      AbortSignal.timeout = original;
    }
  });
});
