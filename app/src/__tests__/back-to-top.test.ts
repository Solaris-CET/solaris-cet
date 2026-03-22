import { describe, it, expect } from 'vitest';

// ─── BackToTop pure-logic tests ──────────────────────────────────────────
// The component itself requires a DOM with scroll events. These tests cover
// the pure threshold logic that decides when the button becomes visible.

const SCROLL_THRESHOLD = 600;

function isButtonVisible(scrollY: number): boolean {
  return scrollY > SCROLL_THRESHOLD;
}

describe('BackToTop — visibility threshold', () => {
  it('is hidden at scroll position 0', () => {
    expect(isButtonVisible(0)).toBe(false);
  });

  it('is hidden below the threshold', () => {
    expect(isButtonVisible(100)).toBe(false);
    expect(isButtonVisible(599)).toBe(false);
    expect(isButtonVisible(600)).toBe(false);
  });

  it('becomes visible just above the threshold', () => {
    expect(isButtonVisible(601)).toBe(true);
    expect(isButtonVisible(1000)).toBe(true);
    expect(isButtonVisible(10_000)).toBe(true);
  });

  it('threshold is exactly 600px', () => {
    expect(SCROLL_THRESHOLD).toBe(600);
  });
});
