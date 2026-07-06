// @vitest-environment jsdom
import { afterEach,beforeEach, describe, expect, it } from 'vitest';

import { useIsMobile } from '../hooks/use-mobile';
import { renderHook } from './renderHook';

const MOBILE_BREAKPOINT = 768;

describe('useIsMobile — breakpoint logic', () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: (_: string, cb: () => void) => { cb(); },
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: originalInnerWidth,
    });
  });

  it('desktop, mobile, breakpoint edge, boolean type', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1440 });
    const { resultRef: d, unmount: u0 } = await renderHook(() => useIsMobile());
    expect(d.current).toBe(false);
    await u0();

    Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });
    const { resultRef: m, unmount: u1 } = await renderHook(() => useIsMobile());
    expect(m.current).toBe(true);
    await u1();

    Object.defineProperty(window, 'innerWidth', { writable: true, value: MOBILE_BREAKPOINT });
    const { resultRef: ex, unmount: u2 } = await renderHook(() => useIsMobile());
    expect(ex.current).toBe(false);
    await u2();

    Object.defineProperty(window, 'innerWidth', { writable: true, value: MOBILE_BREAKPOINT - 1 });
    const { resultRef: em, unmount: u3 } = await renderHook(() => useIsMobile());
    expect(em.current).toBe(true);
    await u3();

    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
    const { resultRef: b, unmount: u4 } = await renderHook(() => useIsMobile());
    expect(typeof b.current).toBe('boolean');
    await u4();
  });
});
