import { describe, expect,it } from 'vitest';

const DISTRIBUTION = [
  { name: 'Mining Rewards (90yr)', pct: 66.66 },
  { name: 'DeDust Liquidity Pool', pct: 20.00 },
  { name: 'DCBM Reserve',          pct:  8.34 },
  { name: 'Team & Development',    pct:  5.00 },
];

const TOTAL_SUPPLY = 9000;

const DEPT_DATA = [
  { name: 'Customer Ops', agents: 48_000 },
  { name: 'Engineering',  agents: 34_000 },
  { name: 'Sales',        agents: 27_000 },
  { name: 'Data & AI',    agents: 21_000 },
  { name: 'Finance',      agents: 18_000 },
  { name: 'Marketing',    agents: 17_000 },
  { name: 'Product',      agents: 13_000 },
  { name: 'Security',     agents: 10_000 },
  { name: 'Legal',        agents:  7_000 },
  { name: 'Research',     agents:  5_000 },
];

const TOTAL_AGENTS = DEPT_DATA.reduce((s, d) => s + d.agents, 0);

describe('charts data (tokenomics + departments)', () => {
  it('distribution + department registry', () => {
    expect(DISTRIBUTION).toHaveLength(4);
    const sum = DISTRIBUTION.reduce((s, d) => s + d.pct, 0);
    expect(sum).toBeCloseTo(100, 1);
    const largest = [...DISTRIBUTION].sort((a, b) => b.pct - a.pct)[0];
    expect(largest.name).toBe('Mining Rewards (90yr)');
    expect(largest.pct).toBeGreaterThan(50);
    DISTRIBUTION.forEach((d) => {
      expect(d.pct).toBeGreaterThan(0);
      expect(d.pct).toBeLessThan(100);
    });
    expect((66.66 / 100) * TOTAL_SUPPLY).toBeCloseTo(5999.4, 0);
    expect(DISTRIBUTION.find((d) => d.name === 'Team & Development')?.pct).toBe(5.0);
    const dcbm = DISTRIBUTION.find((d) => d.name === 'DCBM Reserve')!;
    const team = DISTRIBUTION.find((d) => d.name === 'Team & Development')!;
    expect(dcbm.pct + team.pct).toBeCloseTo(13.34, 1);

    expect(DEPT_DATA).toHaveLength(10);
    expect(TOTAL_AGENTS).toBe(200_000);
    const byDesc = [...DEPT_DATA].sort((a, b) => b.agents - a.agents);
    expect(byDesc[0].name).toBe('Customer Ops');
    expect([...DEPT_DATA].sort((a, b) => a.agents - b.agents)[0].name).toBe('Research');
    DEPT_DATA.forEach((d) => {
      expect(d.agents).toBeGreaterThan(0);
      expect(d.agents % 1000).toBe(0);
    });
    const top3 = byDesc.slice(0, 3);
    expect(top3.reduce((s, d) => s + d.agents, 0) / TOTAL_AGENTS).toBeGreaterThan(0.5);
  });
});
