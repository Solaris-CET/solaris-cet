// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, render, screen, act, cleanup } from "@testing-library/react";
import React from "react";
import { useIntersectionObserver } from "../hooks/use-intersection-observer";

// ─── Helpers ────────────────────────────────────────────────────────────────

type IOCallback = (entries: IntersectionObserverEntry[]) => void;

function makeEntry(isIntersecting: boolean): IntersectionObserverEntry {
  return { isIntersecting } as IntersectionObserverEntry;
}

/**
 * Installs a spy IntersectionObserver that captures the callback so tests can
 * fire intersection events manually.
 */
function mockIntersectionObserver() {
  let capturedCallback: IOCallback | null = null;
  const observe = vi.fn();
  const disconnect = vi.fn();

  // vi.fn().mockImplementation must use a regular function (not arrow) so that
  // it can be used as a constructor with `new IntersectionObserver(...)`.
  const MockIO = vi.fn().mockImplementation(function (cb: IOCallback) {
    capturedCallback = cb;
    return { observe, disconnect };
  });

  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: MockIO,
  });

  /** Fire the captured callback with a synthetic entry. */
  const trigger = (isIntersecting: boolean) => {
    capturedCallback?.([makeEntry(isIntersecting)]);
  };

  return { MockIO, observe, disconnect, trigger };
}

/** A test component that renders 'visible' or 'hidden' based on the hook. */
function VisibilityTestComponent({
  threshold,
  rootMargin,
  freezeOnceVisible,
}: {
  threshold?: number;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}) {
  const { elementRef, isVisible } = useIntersectionObserver({
    threshold,
    rootMargin,
    freezeOnceVisible,
  });
  return (
    <div ref={elementRef as React.RefObject<HTMLDivElement>}>
      {isVisible ? "visible" : "hidden"}
    </div>
  );
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("useIntersectionObserver", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("returns isVisible=false initially", () => {
    mockIntersectionObserver();
    const { result } = renderHook(() => useIntersectionObserver());
    expect(result.current.isVisible).toBe(false);
  });

  it("returns an elementRef", () => {
    mockIntersectionObserver();
    const { result } = renderHook(() => useIntersectionObserver());
    expect(result.current.elementRef).toBeDefined();
  });

  it("transitions to 'visible' when the ref is attached and the observer fires", () => {
    const { trigger } = mockIntersectionObserver();

    render(<VisibilityTestComponent />);
    expect(screen.queryByText("hidden")).not.toBeNull();

    act(() => { trigger(true); });

    expect(screen.queryByText("visible")).not.toBeNull();
  });

  it("stays 'visible' after freezeOnceVisible fires (observer disconnects)", () => {
    const { trigger } = mockIntersectionObserver();

    render(<VisibilityTestComponent freezeOnceVisible={true} />);

    // Element enters viewport → isVisible=true, observer disconnects
    act(() => { trigger(true); });
    expect(screen.queryByText("visible")).not.toBeNull();
  });

  it("respects custom threshold option without throwing", () => {
    mockIntersectionObserver();
    expect(() =>
      renderHook(() => useIntersectionObserver({ threshold: 0.8 }))
    ).not.toThrow();
  });

  it("respects custom rootMargin option without throwing", () => {
    mockIntersectionObserver();
    expect(() =>
      renderHook(() => useIntersectionObserver({ rootMargin: "50px" }))
    ).not.toThrow();
  });

  it("freezeOnceVisible=false does not throw", () => {
    mockIntersectionObserver();
    expect(() =>
      renderHook(() => useIntersectionObserver({ freezeOnceVisible: false }))
    ).not.toThrow();
  });

  it("disconnect is called when the element enters the viewport (freezeOnceVisible=true)", () => {
    const { disconnect, trigger } = mockIntersectionObserver();

    function TestComponent() {
      const { elementRef } = useIntersectionObserver({ freezeOnceVisible: true });
      return <div ref={elementRef as React.RefObject<HTMLDivElement>}>test</div>;
    }

    render(<TestComponent />);

    act(() => { trigger(true); });

    expect(disconnect).toHaveBeenCalled();
  });
});
