// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from './renderHook';
import { useIsMobile } from '../hooks/use-mobile';

const MOBILE_BREAKPOINT = 768;

describe('useIsMobile — breakpoint logic', () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    // Reset matchMedia mock before each test
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

  it('returns false when window.innerWidth is at desktop width', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1440 });
    const { resultRef, unmount } = await renderHook(() => useIsMobile());
    expect(resultRef.current).toBe(false);
    await unmount();
  });

  it('returns true when window.innerWidth is below mobile breakpoint', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });
    const { resultRef, unmount } = await renderHook(() => useIsMobile());
    expect(resultRef.current).toBe(true);
    await unmount();
  });

  it('returns false at exactly the breakpoint (768px is desktop)', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: MOBILE_BREAKPOINT });
    const { resultRef, unmount: u1 } = await renderHook(() => useIsMobile());
    expect(resultRef.current).toBe(false);
    await u1();
  });

  it('returns true at breakpoint - 1 (767px is mobile)', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: MOBILE_BREAKPOINT - 1 });
    const { resultRef, unmount: u2 } = await renderHook(() => useIsMobile());
    expect(resultRef.current).toBe(true);
    await u2();
  });

  it('returns boolean (never undefined after mount)', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
    const { resultRef, unmount } = await renderHook(() => useIsMobile());
    expect(typeof resultRef.current).toBe('boolean');
    await unmount();
  });
});
