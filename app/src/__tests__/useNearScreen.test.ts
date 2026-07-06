// @vitest-environment jsdom
import type { RefObject } from 'react';
import { createElement } from 'react';
import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest';

import { useNearScreen } from '../hooks/useNearScreen';
import { act,renderHook } from './renderHook';

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

function withElement(result: { fromRef: RefObject<HTMLDivElement | null> }) {
  return createElement('div', { ref: result.fromRef });
}

describe('useNearScreen', () => {
  it('false until intersect, then true; fromRef; custom distance', async () => {
    const { resultRef } = await renderHook(() => useNearScreen(), withElement);
    expect(resultRef.current.isNearScreen).toBe(false);
    await fireIntersection(true);
    expect(resultRef.current.isNearScreen).toBe(true);

    const { resultRef: r2 } = await renderHook(() => useNearScreen());
    expect(r2.current.fromRef).toBeDefined();
    expect(typeof r2.current.fromRef).toBe('object');

    const { resultRef: r3 } = await renderHook(
      () => useNearScreen({ distance: '500px' }),
      withElement,
    );
    expect(r3.current.isNearScreen).toBe(false);
    await fireIntersection(true);
    expect(r3.current.isNearScreen).toBe(true);
  });
});
