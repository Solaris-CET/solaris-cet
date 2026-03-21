// @vitest-environment jsdom
import { createElement } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from './renderHook';
import { useIntersectionObserver } from '../hooks/use-intersection-observer';

// ---------------------------------------------------------------------------
// IntersectionObserver mock — must be a class so `new IntersectionObserver()`
// works correctly inside the hook.
// ---------------------------------------------------------------------------

type ObserverCallback = (entries: IntersectionObserverEntry[]) => void;

let observerCallback: ObserverCallback | null = null;

class MockIntersectionObserver {
  constructor(callback: ObserverCallback) {
    observerCallback = callback;
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn(() => { observerCallback = null; });
}

beforeEach(() => {
  observerCallback = null;
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function fireIntersection(isIntersecting: boolean) {
  await act(() => {
    observerCallback?.([
      { isIntersecting } as unknown as IntersectionObserverEntry,
    ]);
  });
}

// Wrapper that attaches the hook's elementRef to a real DOM node so the
// hook's `if (!element) return` guard is satisfied.
import type { RefObject } from 'react';
function withElement(result: { elementRef: RefObject<Element | null> }) {
  return createElement('div', { ref: result.elementRef as RefObject<HTMLDivElement> });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useIntersectionObserver', () => {
  it('starts as not visible', async () => {
    const { resultRef } = await renderHook(() => useIntersectionObserver(), withElement);
    expect(resultRef.current.isVisible).toBe(false);
  });

  it('becomes visible when the element intersects', async () => {
    const { resultRef } = await renderHook(() => useIntersectionObserver(), withElement);
    await fireIntersection(true);
    expect(resultRef.current.isVisible).toBe(true);
  });

  it('freezeOnceVisible=true keeps isVisible true after observer disconnects', async () => {
    const { resultRef } = await renderHook(
      () => useIntersectionObserver({ freezeOnceVisible: true }),
      withElement
    );
    await fireIntersection(true);
    expect(resultRef.current.isVisible).toBe(true);
  });

  it('freezeOnceVisible=false reverts to false when element leaves viewport', async () => {
    const { resultRef } = await renderHook(
      () => useIntersectionObserver({ freezeOnceVisible: false }),
      withElement
    );
    await fireIntersection(true);
    expect(resultRef.current.isVisible).toBe(true);
    await fireIntersection(false);
    expect(resultRef.current.isVisible).toBe(false);
  });

  it('returns an elementRef object', async () => {
    const { resultRef } = await renderHook(() => useIntersectionObserver());
    expect(resultRef.current.elementRef).toBeDefined();
    expect(typeof resultRef.current.elementRef).toBe('object');
  });
});
