// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReducedMotion } from '../hooks/useReducedMotion';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type MatchMediaMockOptions = { matches: boolean };

/**
 * Replaces `window.matchMedia` with a Jest/Vitest-compatible stub that lets
 * us control which queries return `true` or `false`.
 */
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

  /** Fire a fake MediaQueryList change event to all registered listeners. */
  const fireChange = (newMatches: boolean) => {
    mql.matches = newMatches;
    const event = { matches: newMatches } as MediaQueryListEvent;
    listeners.forEach(l => l(event));
  };

  return { mql, fireChange };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useReducedMotion', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it('returns false when prefers-reduced-motion does NOT match', () => {
    mockMatchMedia({ matches: false });
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('returns true when prefers-reduced-motion matches', () => {
    mockMatchMedia({ matches: true });
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('updates when the media query value changes (false → true)', async () => {
    const { fireChange } = mockMatchMedia({ matches: false });
    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);

    act(() => {
      fireChange(true);
    });

    expect(result.current).toBe(true);
  });

  it('updates when the media query value changes (true → false)', async () => {
    const { fireChange } = mockMatchMedia({ matches: true });
    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(true);

    act(() => {
      fireChange(false);
    });

    expect(result.current).toBe(false);
  });

  it('removes the event listener on unmount', () => {
    const { mql } = mockMatchMedia({ matches: false });
    const removeSpy = vi.spyOn(mql, 'removeEventListener');

    const { unmount } = renderHook(() => useReducedMotion());
    unmount();

    expect(removeSpy).toHaveBeenCalledOnce();
  });
});
