import { describe, it, expect } from 'vitest';

function formatLive(n: number, unit: string): string {
  if (unit === '%') return `${n.toFixed(2)}%`;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(1)}K`;
  return Math.floor(n).toString();
}

const LIVE_STATS = [
  { label: 'Blocks Processed', base: 48_291_047,     perSecond: 5,   unit: '' },
  { label: 'Transactions',     base: 2_841_903_512,  perSecond: 120, unit: '' },
  { label: 'Validators Active',base: 340,            perSecond: 0,   unit: '' },
  { label: 'Agent Actions',    base: 12_847_293,     perSecond: 8.4, unit: '' },
  { label: 'Countries Reached',base: 147,            perSecond: 0,   unit: '' },
  { label: 'Uptime',           base: 99.97,          perSecond: 0,   unit: '%' },
];

describe('NetworkPulse', () => {
  it('formatLive scales + % priority + floor', () => {
    expect(formatLive(2_841_903_512, '')).toBe('2.8B');
    expect(formatLive(1_000_000_000, '')).toBe('1.0B');
    expect(formatLive(12_847_293, '')).toBe('12.8M');
    expect(formatLive(1_000_000, '')).toBe('1.0M');
    expect(formatLive(48_291, '')).toBe('48.3K');
    expect(formatLive(1_000, '')).toBe('1.0K');
    expect(formatLive(340, '')).toBe('340');
    expect(formatLive(147, '')).toBe('147');
    expect(formatLive(0, '')).toBe('0');
    expect(formatLive(99.97, '%')).toBe('99.97%');
    expect(formatLive(100, '%')).toBe('100.00%');
    expect(formatLive(50.5, '%')).toBe('50.50%');
    expect(formatLive(1_000_000, '%')).toBe('1000000.00%');
    expect(formatLive(999.9, '')).toBe('999');
    expect(formatLive(0.5, '')).toBe('0');
  });

  it('LIVE_STATS shape and rates', () => {
    expect(LIVE_STATS).toHaveLength(6);
    LIVE_STATS.forEach((s) => {
      expect(s.base).toBeGreaterThan(0);
      expect(s.perSecond).toBeGreaterThanOrEqual(0);
    });
    const fastest = [...LIVE_STATS].sort((a, b) => b.perSecond - a.perSecond)[0];
    expect(fastest.label).toBe('Transactions');
    const pctStats = LIVE_STATS.filter((s) => s.unit === '%');
    expect(pctStats).toHaveLength(1);
    expect(pctStats[0].label).toBe('Uptime');
    expect(LIVE_STATS.find((s) => s.label === 'Uptime')!.base).toBeLessThanOrEqual(100);
  });
});
