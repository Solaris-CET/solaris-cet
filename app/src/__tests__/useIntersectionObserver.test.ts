// @vitest-environment jsdom
import { createElement } from 'react';
import type { RefObject } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from './renderHook';
import { useIntersectionObserver } from '../hooks/use-intersection-observer';

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

function withElement(result: { elementRef: RefObject<Element | null> }) {
  return createElement('div', { ref: result.elementRef as RefObject<HTMLDivElement> });
}

describe('useIntersectionObserver', () => {
  it('visibility lifecycle, freeze modes, elementRef', async () => {
    const { resultRef: r1 } = await renderHook(() => useIntersectionObserver(), withElement);
    expect(r1.current.isVisible).toBe(false);
    await fireIntersection(true);
    expect(r1.current.isVisible).toBe(true);

    const { resultRef: r2 } = await renderHook(
      () => useIntersectionObserver({ freezeOnceVisible: true }),
      withElement,
    );
    await fireIntersection(true);
    expect(r2.current.isVisible).toBe(true);

    const { resultRef: r3 } = await renderHook(
      () => useIntersectionObserver({ freezeOnceVisible: false }),
      withElement,
    );
    await fireIntersection(true);
    expect(r3.current.isVisible).toBe(true);
    await fireIntersection(false);
    expect(r3.current.isVisible).toBe(false);

    const { resultRef: r4 } = await renderHook(() => useIntersectionObserver());
    expect(r4.current.elementRef).toBeDefined();
    expect(typeof r4.current.elementRef).toBe('object');
  });
});
