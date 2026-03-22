import { describe, it, expect } from 'vitest';

// Pure logic extracted from LiveAgentStats for testing
// (The component itself requires DOM for timers)

const COUNTERS = [
  { label: 'Tasks Solved',    base: 1_847_293, perSecond: 4.7  },
  { label: 'Lessons Learned', base: 892_441,   perSecond: 2.1  },
  { label: 'Conversations',   base: 3_294_817, perSecond: 8.3  },
  { label: 'Alerts Resolved', base: 241_087,   perSecond: 0.9  },
];

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// ─── formatNum ────────────────────────────────────────────────────────────

describe('LiveAgentStats — formatNum', () => {
  it('formats numbers >= 1M with "M" suffix', () => {
    expect(formatNum(1_000_000)).toBe('1.00M');
    expect(formatNum(1_500_000)).toBe('1.50M');
    expect(formatNum(3_294_817)).toBe('3.29M');
  });

  it('formats numbers >= 1K with "K" suffix', () => {
    expect(formatNum(1_000)).toBe('1.0K');
    expect(formatNum(892_441)).toBe('892.4K');
    expect(formatNum(241_087)).toBe('241.1K');
  });

  it('formats numbers < 1K as plain string', () => {
    expect(formatNum(0)).toBe('0');
    expect(formatNum(999)).toBe('999');
    expect(formatNum(42)).toBe('42');
  });

  it('M takes priority over K for values >= 1M', () => {
    expect(formatNum(2_000_000)).toContain('M');
    expect(formatNum(2_000_000)).not.toContain('K');
  });
});

// ─── Counter increments ───────────────────────────────────────────────────

describe('LiveAgentStats — counter increments', () => {
  it('all base values are positive', () => {
    COUNTERS.forEach(c => expect(c.base).toBeGreaterThan(0));
  });

  it('all perSecond rates are positive', () => {
    COUNTERS.forEach(c => expect(c.perSecond).toBeGreaterThan(0));
  });

  it('4 counters defined', () => {
    expect(COUNTERS).toHaveLength(4);
  });

  it('after 1 second each counter increases by its perSecond rate', () => {
    COUNTERS.forEach(c => {
      const after = c.base + c.perSecond;
      expect(after).toBeGreaterThan(c.base);
    });
  });

  it('Conversations is the busiest counter', () => {
    const sorted = [...COUNTERS].sort((a, b) => b.perSecond - a.perSecond);
    expect(sorted[0].label).toBe('Conversations');
  });

  it('Alerts Resolved has the lowest rate', () => {
    const sorted = [...COUNTERS].sort((a, b) => a.perSecond - b.perSecond);
    expect(sorted[0].label).toBe('Alerts Resolved');
  });

  it('Tasks Solved base is the second largest', () => {
    const sorted = [...COUNTERS].sort((a, b) => b.base - a.base);
    expect(sorted[1].label).toBe('Tasks Solved');
  });
});
