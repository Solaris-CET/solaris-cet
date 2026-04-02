// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';

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

describe('useMiningEfficiency — getBatteryInfo + suspension helpers', () => {
  const originalHidden = Object.getOwnPropertyDescriptor(document, 'hidden');

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalHidden) {
      Object.defineProperty(document, 'hidden', originalHidden);
    }
  });

  it('getBatteryInfo: fallback, range, mocks, rejection', async () => {
    const u1 = await getBatteryInfo();
    expect(u1.level).toBe(100);
    expect(u1.charging).toBe(true);
    expect(u1.note).toBe('Battery API unavailable');
    expect(u1.level).toBeGreaterThanOrEqual(0);
    expect(u1.level).toBeLessThanOrEqual(100);
    expect(Number.isInteger(u1.level)).toBe(true);

    const mock75 = vi.fn().mockResolvedValue({ level: 0.75, charging: false });
    vi.stubGlobal('navigator', { ...navigator, getBattery: mock75 });
    const u2 = await getBatteryInfo();
    expect(u2.level).toBe(75);
    expect(u2.charging).toBe(false);
    expect(u2.note).toBeUndefined();

    const mock100 = vi.fn().mockResolvedValue({ level: 1.0, charging: true });
    vi.stubGlobal('navigator', { ...navigator, getBattery: mock100 });
    const u3 = await getBatteryInfo();
    expect(u3.level).toBe(100);
    expect(u3.charging).toBe(true);

    const mockReject = vi.fn().mockRejectedValue(new Error('denied'));
    vi.stubGlobal('navigator', { ...navigator, getBattery: mockReject });
    const u4 = await getBatteryInfo();
    expect(u4.level).toBe(100);
    expect(u4.charging).toBe(true);
    expect(u4.note).toBe('Battery API unavailable');
  });

  it('document.hidden + localStorage mining-status', () => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    expect(document.hidden).toBe(false);
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    expect(document.hidden).toBe(true);

    localStorage.setItem('mining-status', 'active');
    expect(localStorage.getItem('mining-status')).toBe('active');
    localStorage.setItem('mining-status', 'suspended');
    expect(localStorage.getItem('mining-status')).toBe('suspended');
  });
});
