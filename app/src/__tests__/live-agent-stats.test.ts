import { describe, it, expect } from 'vitest';

const COUNTERS = [
  { label: 'Tasks Solved', base: 1_847_293, perSecond: 4.7 },
  { label: 'Lessons Learned', base: 892_441, perSecond: 2.1 },
  { label: 'Conversations', base: 3_294_817, perSecond: 8.3 },
  { label: 'Alerts Resolved', base: 241_087, perSecond: 0.9 },
  { label: 'Skill Loci Live', base: 1_203_884, perSecond: 5.2 },
];

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

describe('LiveAgentStats — inline pure logic', () => {
  it('formatNum tiers, counter invariants, ordering', () => {
    expect(formatNum(1_000_000)).toBe('1.00M');
    expect(formatNum(1_500_000)).toBe('1.50M');
    expect(formatNum(3_294_817)).toBe('3.29M');
    expect(formatNum(1_000)).toBe('1.0K');
    expect(formatNum(892_441)).toBe('892.4K');
    expect(formatNum(241_087)).toBe('241.1K');
    expect(formatNum(0)).toBe('0');
    expect(formatNum(999)).toBe('999');
    expect(formatNum(42)).toBe('42');
    expect(formatNum(2_000_000)).toContain('M');
    expect(formatNum(2_000_000)).not.toContain('K');

    expect(COUNTERS).toHaveLength(5);
    COUNTERS.forEach((c) => {
      expect(c.base).toBeGreaterThan(0);
      expect(c.perSecond).toBeGreaterThan(0);
      expect(c.base + c.perSecond).toBeGreaterThan(c.base);
    });
    const byRate = [...COUNTERS].sort((a, b) => b.perSecond - a.perSecond);
    expect(byRate[0].label).toBe('Conversations');
    expect([...COUNTERS].sort((a, b) => a.perSecond - b.perSecond)[0].label).toBe('Alerts Resolved');
    const byBase = [...COUNTERS].sort((a, b) => b.base - a.base);
    expect(byBase[1].label).toBe('Tasks Solved');
  });
});
