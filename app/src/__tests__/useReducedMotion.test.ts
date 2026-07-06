// @vitest-environment jsdom
import { act,renderHook } from '@testing-library/react';
import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest';

import { useReducedMotion } from '../hooks/useReducedMotion';

type MatchMediaMockOptions = { matches: boolean };

function mockMatchMedia(options: MatchMediaMockOptions) {
  const listeners: ((e: MediaQueryListEvent) => void)[] = [];

  const mql = {
    matches: options.matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: (_: string, listener: (e: MediaQueryListEvent) => void) => {
      listeners.push(listener);
    },
    removeEventListener: (_: string, listener: (e: MediaQueryListEvent) => void) => {
      const idx = listeners.indexOf(listener);
      if (idx !== -1) listeners.splice(idx, 1);
    },
    dispatchEvent: () => false,
  };

  window.matchMedia = vi.fn().mockReturnValue(mql);

  const fireChange = (newMatches: boolean) => {
    mql.matches = newMatches;
    const event = { matches: newMatches } as MediaQueryListEvent;
    listeners.forEach((l) => l(event));
  };

  return { mql, fireChange };
}

describe('useReducedMotion', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it('initial match, toggles, unmount removes listener', () => {
    mockMatchMedia({ matches: false });
    const { result: r1 } = renderHook(() => useReducedMotion());
    expect(r1.current).toBe(false);

    mockMatchMedia({ matches: true });
    const { result: r2 } = renderHook(() => useReducedMotion());
    expect(r2.current).toBe(true);

    const { fireChange: fc1 } = mockMatchMedia({ matches: false });
    const { result: r3 } = renderHook(() => useReducedMotion());
    expect(r3.current).toBe(false);
    act(() => { fc1(true); });
    expect(r3.current).toBe(true);

    const { fireChange: fc2 } = mockMatchMedia({ matches: true });
    const { result: r4 } = renderHook(() => useReducedMotion());
    expect(r4.current).toBe(true);
    act(() => { fc2(false); });
    expect(r4.current).toBe(false);

    const { mql } = mockMatchMedia({ matches: false });
    const removeSpy = vi.spyOn(mql, 'removeEventListener');
    const { unmount } = renderHook(() => useReducedMotion());
    unmount();
    expect(removeSpy).toHaveBeenCalledOnce();
  });
});
