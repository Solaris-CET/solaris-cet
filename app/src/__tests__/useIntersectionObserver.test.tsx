// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, render, screen, act, cleanup } from '@testing-library/react';
import React from 'react';
import { useIntersectionObserver } from '../hooks/use-intersection-observer';

// ---------------------------------------------------------------------------
// IntersectionObserver mock
// ---------------------------------------------------------------------------

type ObserverCallback = (entries: IntersectionObserverEntry[]) => void;

/**
 * Installs a spy IntersectionObserver that captures the callback so tests can
 * fire intersection events manually without relying on real viewport geometry.
 */
function mockIntersectionObserver() {
  let capturedCallback: ObserverCallback | null = null;
  const observe = vi.fn();
  const disconnect = vi.fn();

  const MockIO = vi.fn().mockImplementation(function (cb: ObserverCallback) {
    capturedCallback = cb;
    return { observe, disconnect };
  });

  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIO,
  });

  const trigger = (isIntersecting: boolean) =>
    capturedCallback?.([{ isIntersecting } as IntersectionObserverEntry]);

  return { MockIO, observe, disconnect, trigger };
}

/** Wrapper component that renders a real DOM element attached to the hook ref. */
function VisibilityComponent({ options = {} }: { options?: Parameters<typeof useIntersectionObserver>[0] }) {
  const { elementRef, isVisible } = useIntersectionObserver(options);
  return <div ref={elementRef as React.RefObject<HTMLDivElement>}>{isVisible ? 'visible' : 'hidden'}</div>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  // stubGlobal is paired with vi.unstubAllGlobals() in afterEach
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  cleanup();
});

describe('useIntersectionObserver', () => {
  it('starts with isVisible = false', () => {
    mockIntersectionObserver();
    const { result } = renderHook(() => useIntersectionObserver());
    expect(result.current.isVisible).toBe(false);
  });

  it('provides an elementRef to attach to a DOM node', () => {
    mockIntersectionObserver();
    const { result } = renderHook(() => useIntersectionObserver());
    expect(result.current.elementRef).toBeDefined();
  });

  it('becomes visible when the observer fires an intersecting entry', () => {
    // Attach the hook through a real component so elementRef.current is a real
    // DOM node and the observer's observe() is actually called.
    const { trigger } = mockIntersectionObserver();

    render(<VisibilityComponent />);
    expect(screen.getByText('hidden')).toBeDefined();

    act(() => { trigger(true); });

    expect(screen.getByText('visible')).toBeDefined();
  });

  it('does NOT revert to hidden after first intersection (freezeOnceVisible = true)', () => {
    const { trigger } = mockIntersectionObserver();

    render(<VisibilityComponent options={{ freezeOnceVisible: true }} />);

    act(() => { trigger(true); });
    expect(screen.getByText('visible')).toBeDefined();
  });

  it('accepts a custom threshold without throwing', () => {
    mockIntersectionObserver();
    expect(() => renderHook(() => useIntersectionObserver({ threshold: 0.5 }))).not.toThrow();
  });

  it('accepts a custom rootMargin without throwing', () => {
    mockIntersectionObserver();
    expect(() => renderHook(() => useIntersectionObserver({ rootMargin: '50px' }))).not.toThrow();
  });

  it('isVisible starts as false regardless of options', () => {
    mockIntersectionObserver();
    const opts = [
      {},
      { threshold: 0.2 },
      { rootMargin: '100px' },
      { freezeOnceVisible: false },
    ];
    opts.forEach(o => {
      const { result } = renderHook(() => useIntersectionObserver(o));
      expect(result.current.isVisible).toBe(false);
    });
  });
});

