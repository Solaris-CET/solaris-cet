// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "../hooks/useDebounce";

// Vitest ships with jsdom but doesn't automatically provide testing-library.
// The hook is pure logic — we can test it with fake timers.

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("hello", 300));
    expect(result.current).toBe("hello");
  });

  it("does not update the debounced value before the delay elapses", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 300),
      { initialProps: { value: "initial" } },
    );

    rerender({ value: "updated" });

    // Not yet elapsed — still the initial value
    expect(result.current).toBe("initial");
  });

  it("updates the debounced value after the delay elapses", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 300),
      { initialProps: { value: "initial" } },
    );

    rerender({ value: "updated" });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe("updated");
  });

  it("resets the timer when value changes before the delay elapses", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 300),
      { initialProps: { value: "a" } },
    );

    rerender({ value: "b" });
    act(() => { vi.advanceTimersByTime(200); }); // partial advance

    rerender({ value: "c" });
    act(() => { vi.advanceTimersByTime(200); }); // still not 300ms since last change

    // Only 200ms elapsed since last change to "c" — still "a"
    expect(result.current).toBe("a");

    act(() => { vi.advanceTimersByTime(100); }); // now 300ms since "c"

    expect(result.current).toBe("c");
  });

  it("uses the default delay of 300 ms when none is provided", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: number }) => useDebounce(value),
      { initialProps: { value: 1 } },
    );

    rerender({ value: 2 });

    act(() => { vi.advanceTimersByTime(299); });
    expect(result.current).toBe(1);

    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current).toBe(2);
  });

  it("works with object values", () => {
    const obj1 = { x: 1 };
    const obj2 = { x: 2 };

    const { result, rerender } = renderHook(
      ({ value }: { value: { x: number } }) => useDebounce(value, 100),
      { initialProps: { value: obj1 } },
    );

    rerender({ value: obj2 });

    act(() => { vi.advanceTimersByTime(100); });

    expect(result.current).toBe(obj2);
  });
});
