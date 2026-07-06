// @vitest-environment jsdom
import { act,renderHook } from "@testing-library/react";
import { afterEach,beforeEach, describe, expect, it, vi } from "vitest";

import { useMiningEfficiency } from "../hooks/useMiningEfficiency";

describe("useMiningEfficiency", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(document, "hidden", {
      writable: true,
      configurable: true,
      value: false,
    });
  });

  it("visibility, worker SUSPEND/RESUME, getBatteryInfo", async () => {
    Object.defineProperty(document, "hidden", {
      writable: true,
      configurable: true,
      value: false,
    });
    const { result: v0 } = renderHook(() => useMiningEfficiency());
    expect(v0.current.isSuspended).toBe(false);

    Object.defineProperty(document, "hidden", {
      writable: true,
      configurable: true,
      value: true,
    });
    const { result: v1 } = renderHook(() => useMiningEfficiency());
    expect(v1.current.isSuspended).toBe(true);

    Object.defineProperty(document, "hidden", {
      writable: true,
      configurable: true,
      value: false,
    });
    const { result: v2 } = renderHook(() => useMiningEfficiency());
    expect(v2.current.isSuspended).toBe(false);
    act(() => {
      Object.defineProperty(document, "hidden", {
        writable: true,
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(v2.current.isSuspended).toBe(true);
    expect(localStorage.getItem("mining-status")).toBe("suspended");

    Object.defineProperty(document, "hidden", {
      writable: true,
      configurable: true,
      value: true,
    });
    const { result: v3 } = renderHook(() => useMiningEfficiency());
    expect(v3.current.isSuspended).toBe(true);
    act(() => {
      Object.defineProperty(document, "hidden", {
        writable: true,
        configurable: true,
        value: false,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(v3.current.isSuspended).toBe(false);
    expect(localStorage.getItem("mining-status")).toBe("active");

    Object.defineProperty(document, "hidden", {
      writable: true,
      configurable: true,
      value: false,
    });
    const post1 = vi.fn();
    const workerRef1 = { current: { postMessage: post1 } as unknown as Worker };
    renderHook(() => useMiningEfficiency(workerRef1));
    act(() => {
      Object.defineProperty(document, "hidden", {
        writable: true,
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(post1).toHaveBeenCalledWith({ type: "SUSPEND" });

    Object.defineProperty(document, "hidden", {
      writable: true,
      configurable: true,
      value: true,
    });
    const post2 = vi.fn();
    const workerRef2 = { current: { postMessage: post2 } as unknown as Worker };
    renderHook(() => useMiningEfficiency(workerRef2));
    act(() => {
      Object.defineProperty(document, "hidden", {
        writable: true,
        configurable: true,
        value: false,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(post2).toHaveBeenCalledWith({ type: "RESUME" });

    const { result: bat } = renderHook(() => useMiningEfficiency());
    const fallback = await bat.current.getBatteryInfo();
    expect(fallback).toMatchObject({ level: 100, charging: true });

    const mockGetBattery = vi.fn().mockResolvedValue({
      level: 0.75,
      charging: false,
    });
    Object.defineProperty(navigator, "getBattery", {
      writable: true,
      configurable: true,
      value: mockGetBattery,
    });
    const { result: bat2 } = renderHook(() => useMiningEfficiency());
    const ok = await bat2.current.getBatteryInfo();
    expect(ok).toEqual({ level: 75, charging: false });
  });
});
