// @vitest-environment jsdom
import { createElement } from 'react';
import type { RefObject } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from './renderHook';
import { useNearScreen } from '../hooks/useNearScreen';

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

// Wrapper that attaches the hook's fromRef to a real DOM node so the
// hook's `if (!element) return` guard is satisfied.
function withElement(result: { fromRef: RefObject<HTMLDivElement | null> }) {
  return createElement('div', { ref: result.fromRef });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useNearScreen', () => {
  it('starts with isNearScreen = false', async () => {
    const { resultRef } = await renderHook(() => useNearScreen(), withElement);
    expect(resultRef.current.isNearScreen).toBe(false);
  });

  it('sets isNearScreen to true when element enters viewport', async () => {
    const { resultRef } = await renderHook(() => useNearScreen(), withElement);
    await fireIntersection(true);
    expect(resultRef.current.isNearScreen).toBe(true);
  });

  it('stays true once the element has been near the screen', async () => {
    const { resultRef } = await renderHook(() => useNearScreen(), withElement);
    await fireIntersection(true);
    // observer disconnects after first intersection, so further events are no-ops
    expect(resultRef.current.isNearScreen).toBe(true);
  });

  it('returns a fromRef object', async () => {
    const { resultRef } = await renderHook(() => useNearScreen());
    expect(resultRef.current.fromRef).toBeDefined();
    expect(typeof resultRef.current.fromRef).toBe('object');
  });

  it('accepts a custom distance option', async () => {
    const { resultRef } = await renderHook(
      () => useNearScreen({ distance: '500px' }),
      withElement
    );
    expect(resultRef.current.isNearScreen).toBe(false);
    await fireIntersection(true);
    expect(resultRef.current.isNearScreen).toBe(true);
  });
});
