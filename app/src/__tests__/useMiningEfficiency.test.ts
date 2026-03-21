// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMiningEfficiency } from "../hooks/useMiningEfficiency";

describe("useMiningEfficiency", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // Reset document.hidden to its default (visible)
    Object.defineProperty(document, "hidden", {
      writable: true,
      configurable: true,
      value: false,
    });
  });

  it("starts as not suspended when tab is visible", () => {
    Object.defineProperty(document, "hidden", {
      writable: true,
      configurable: true,
      value: false,
    });

    const { result } = renderHook(() => useMiningEfficiency());
    expect(result.current.isSuspended).toBe(false);
  });

  it("starts as suspended when tab is hidden", () => {
    Object.defineProperty(document, "hidden", {
      writable: true,
      configurable: true,
      value: true,
    });

    const { result } = renderHook(() => useMiningEfficiency());
    expect(result.current.isSuspended).toBe(true);
  });

  it("suspends when visibilitychange fires with hidden=true", () => {
    Object.defineProperty(document, "hidden", {
      writable: true,
      configurable: true,
      value: false,
    });

    const { result } = renderHook(() => useMiningEfficiency());
    expect(result.current.isSuspended).toBe(false);

    act(() => {
      Object.defineProperty(document, "hidden", {
        writable: true,
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(result.current.isSuspended).toBe(true);
  });

  it("resumes when visibilitychange fires with hidden=false", () => {
    Object.defineProperty(document, "hidden", {
      writable: true,
      configurable: true,
      value: true,
    });

    const { result } = renderHook(() => useMiningEfficiency());
    expect(result.current.isSuspended).toBe(true);

    act(() => {
      Object.defineProperty(document, "hidden", {
        writable: true,
        configurable: true,
        value: false,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(result.current.isSuspended).toBe(false);
  });

  it("posts SUSPEND message to worker when tab hides", () => {
    Object.defineProperty(document, "hidden", {
      writable: true,
      configurable: true,
      value: false,
    });

    const postMessage = vi.fn();
    const workerRef = { current: { postMessage } as unknown as Worker };

    renderHook(() => useMiningEfficiency(workerRef));

    act(() => {
      Object.defineProperty(document, "hidden", {
        writable: true,
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(postMessage).toHaveBeenCalledWith({ type: "SUSPEND" });
  });

  it("posts RESUME message to worker when tab becomes visible", () => {
    Object.defineProperty(document, "hidden", {
      writable: true,
      configurable: true,
      value: true,
    });

    const postMessage = vi.fn();
    const workerRef = { current: { postMessage } as unknown as Worker };

    renderHook(() => useMiningEfficiency(workerRef));

    act(() => {
      Object.defineProperty(document, "hidden", {
        writable: true,
        configurable: true,
        value: false,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(postMessage).toHaveBeenCalledWith({ type: "RESUME" });
  });

  describe("getBatteryInfo", () => {
    it("returns a fallback when Battery API is unavailable", async () => {
      const { result } = renderHook(() => useMiningEfficiency());
      const info = await result.current.getBatteryInfo();
      expect(info).toMatchObject({ level: 100, charging: true });
    });

    it("returns battery data when Battery API succeeds", async () => {
      const mockGetBattery = vi.fn().mockResolvedValue({
        level: 0.75,
        charging: false,
      });
      Object.defineProperty(navigator, "getBattery", {
        writable: true,
        configurable: true,
        value: mockGetBattery,
      });

      const { result } = renderHook(() => useMiningEfficiency());
      const info = await result.current.getBatteryInfo();
      expect(info).toEqual({ level: 75, charging: false });
    });
  });
});
