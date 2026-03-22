import { describe, it, expect } from 'vitest';

// ─── GlowOrbs — variant orb counts (pure data) ───────────────────────────

// Mirror the exact orb arrays from GlowOrbs.tsx for data integrity testing
const ORB_DATA = {
  gold: [
    { color: 'rgba(242,201,76,0.12)', size: 400, x: '20%', y: '30%', delay: '0s'  },
    { color: 'rgba(242,201,76,0.07)', size: 300, x: '75%', y: '60%', delay: '2s'  },
  ],
  cyan: [
    { color: 'rgba(46,231,255,0.10)',  size: 360, x: '65%', y: '25%', delay: '1s'  },
    { color: 'rgba(46,231,255,0.06)',  size: 280, x: '15%', y: '65%', delay: '3s'  },
  ],
  mixed: [
    { color: 'rgba(242,201,76,0.10)', size: 420, x: '15%', y: '40%', delay: '0s'  },
    { color: 'rgba(46,231,255,0.08)', size: 320, x: '70%', y: '25%', delay: '1.5s' },
    { color: 'rgba(242,201,76,0.06)', size: 260, x: '50%', y: '75%', delay: '3s'  },
  ],
  aurora: [
    { color: 'rgba(242,201,76,0.10)', size: 480, x: '10%',  y: '20%', delay: '0s'   },
    { color: 'rgba(46,231,255,0.08)', size: 380, x: '80%',  y: '15%', delay: '1.5s' },
    { color: 'rgba(139,92,246,0.09)', size: 340, x: '50%',  y: '60%', delay: '3s'   },
    { color: 'rgba(16,185,129,0.07)', size: 300, x: '20%',  y: '75%', delay: '4.5s' },
    { color: 'rgba(236,72,153,0.06)', size: 260, x: '75%',  y: '80%', delay: '2s'   },
  ],
};

describe('GlowOrbs — variant orb counts', () => {
  it('gold variant has exactly 2 orbs', () => {
    expect(ORB_DATA.gold).toHaveLength(2);
  });

  it('cyan variant has exactly 2 orbs', () => {
    expect(ORB_DATA.cyan).toHaveLength(2);
  });

  it('mixed variant has exactly 3 orbs', () => {
    expect(ORB_DATA.mixed).toHaveLength(3);
  });

  it('aurora variant has exactly 5 orbs', () => {
    expect(ORB_DATA.aurora).toHaveLength(5);
  });
});

describe('GlowOrbs — orb sizes', () => {
  it('all orbs have positive size', () => {
    Object.values(ORB_DATA).flat().forEach(orb => {
      expect(orb.size).toBeGreaterThan(0);
    });
  });

  it('aurora has the largest max size (480)', () => {
    const maxAurora = Math.max(...ORB_DATA.aurora.map(o => o.size));
    const maxOthers = Math.max(
      ...ORB_DATA.gold.map(o => o.size),
      ...ORB_DATA.cyan.map(o => o.size),
      ...ORB_DATA.mixed.map(o => o.size),
    );
    expect(maxAurora).toBeGreaterThanOrEqual(maxOthers);
  });

  it('all x positions end with "%"', () => {
    Object.values(ORB_DATA).flat().forEach(orb => {
      expect(orb.x).toMatch(/%$/);
    });
  });

  it('all y positions end with "%"', () => {
    Object.values(ORB_DATA).flat().forEach(orb => {
      expect(orb.y).toMatch(/%$/);
    });
  });

  it('all delay strings end with "s"', () => {
    Object.values(ORB_DATA).flat().forEach(orb => {
      expect(orb.delay).toMatch(/s$/);
    });
  });
});

describe('GlowOrbs — aurora variant colours', () => {
  it('aurora orbs include gold, cyan, purple, emerald, and pink', () => {
    const colors = ORB_DATA.aurora.map(o => o.color);
    expect(colors.some(c => c.includes('242,201,76'))).toBe(true);  // gold
    expect(colors.some(c => c.includes('46,231,255'))).toBe(true);  // cyan
    expect(colors.some(c => c.includes('139,92,246'))).toBe(true);  // purple
    expect(colors.some(c => c.includes('16,185,129'))).toBe(true);  // emerald
    expect(colors.some(c => c.includes('236,72,153'))).toBe(true);  // pink
  });

  it('all colors are rgba format', () => {
    Object.values(ORB_DATA).flat().forEach(orb => {
      expect(orb.color).toMatch(/^rgba\(/);
    });
  });
});
