// @vitest-environment jsdom
import { act,renderHook } from "@testing-library/react";
import { afterEach,beforeEach, describe, expect, it, vi } from "vitest";

import { useDebounce } from "../hooks/useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initial value, delay gate, reset on rapid changes, default 300ms, object refs", () => {
    const { result: r0 } = renderHook(() => useDebounce("hello", 300));
    expect(r0.current).toBe("hello");

    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 300),
      { initialProps: { value: "initial" } },
    );
    rerender({ value: "updated" });
    expect(result.current).toBe("initial");
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe("updated");

    const { result: r3, rerender: rr3 } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 300),
      { initialProps: { value: "a" } },
    );
    rr3({ value: "b" });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    rr3({ value: "c" });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(r3.current).toBe("a");
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(r3.current).toBe("c");

    const { result: r4, rerender: rr4 } = renderHook(
      ({ value }: { value: number }) => useDebounce(value),
      { initialProps: { value: 1 } },
    );
    rr4({ value: 2 });
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(r4.current).toBe(1);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(r4.current).toBe(2);

    const obj1 = { x: 1 };
    const obj2 = { x: 2 };
    const { result: r5, rerender: rr5 } = renderHook(
      ({ value }: { value: { x: number } }) => useDebounce(value, 100),
      { initialProps: { value: obj1 } },
    );
    rr5({ value: obj2 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(r5.current).toBe(obj2);
  });
});
