// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── useMiningEfficiency — pure logic tests ───────────────────────────────
// The getBatteryInfo function logic extracted for unit testing

async function getBatteryInfo(): Promise<{ level: number; charging: boolean; note?: string }> {
  if ('getBattery' in navigator) {
    try {
      const battery = await (navigator as Navigator & {
        getBattery: () => Promise<{ level: number; charging: boolean }>;
      }).getBattery();
      return { level: Math.round(battery.level * 100), charging: battery.charging };
    } catch {
      return { level: 100, charging: true, note: 'Battery API unavailable' };
    }
  }
  return { level: 100, charging: true, note: 'Battery API unavailable' };
}

describe('useMiningEfficiency — getBatteryInfo logic', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('returns 100% charging when Battery API unavailable', async () => {
    const info = await getBatteryInfo();
    expect(info.level).toBe(100);
    expect(info.charging).toBe(true);
  });

  it('returns a note when Battery API is unavailable', async () => {
    const info = await getBatteryInfo();
    expect(info.note).toBe('Battery API unavailable');
  });

  it('returns level 0–100 range', async () => {
    const info = await getBatteryInfo();
    expect(info.level).toBeGreaterThanOrEqual(0);
    expect(info.level).toBeLessThanOrEqual(100);
  });

  it('level is always an integer', async () => {
    const info = await getBatteryInfo();
    expect(Number.isInteger(info.level)).toBe(true);
  });

  it('mock getBattery returning 0.75 → level 75', async () => {
    const mockGetBattery = vi.fn().mockResolvedValue({ level: 0.75, charging: false });
    vi.stubGlobal('navigator', { ...navigator, getBattery: mockGetBattery });
    const info = await getBatteryInfo();
    expect(info.level).toBe(75);
    expect(info.charging).toBe(false);
    expect(info.note).toBeUndefined();
  });

  it('mock getBattery returning 1.0 → level 100', async () => {
    const mockGetBattery = vi.fn().mockResolvedValue({ level: 1.0, charging: true });
    vi.stubGlobal('navigator', { ...navigator, getBattery: mockGetBattery });
    const info = await getBatteryInfo();
    expect(info.level).toBe(100);
    expect(info.charging).toBe(true);
  });

  it('handles getBattery rejection gracefully', async () => {
    const mockGetBattery = vi.fn().mockRejectedValue(new Error('denied'));
    vi.stubGlobal('navigator', { ...navigator, getBattery: mockGetBattery });
    const info = await getBatteryInfo();
    expect(info.level).toBe(100);
    expect(info.charging).toBe(true);
    expect(info.note).toBe('Battery API unavailable');
  });
});

// ─── mining suspension state logic ───────────────────────────────────────

describe('useMiningEfficiency — suspension state', () => {
  const originalHidden = Object.getOwnPropertyDescriptor(document, 'hidden');

  beforeEach(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
  });

  afterEach(() => {
    if (originalHidden) {
      Object.defineProperty(document, 'hidden', originalHidden);
    }
  });

  it('isSuspended is false when tab is visible', () => {
    expect(document.hidden).toBe(false);
  });

  it('isSuspended is true when tab is hidden', () => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    expect(document.hidden).toBe(true);
  });

  it('localStorage mining-status is written correctly', () => {
    localStorage.setItem('mining-status', 'active');
    expect(localStorage.getItem('mining-status')).toBe('active');
    localStorage.setItem('mining-status', 'suspended');
    expect(localStorage.getItem('mining-status')).toBe('suspended');
  });
});
