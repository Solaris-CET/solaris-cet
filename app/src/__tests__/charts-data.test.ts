import { describe, it, expect } from 'vitest';

// ─── TokenomicsChart — distribution data integrity ────────────────────────

const DISTRIBUTION = [
  { name: 'Mining Rewards (90yr)', pct: 66.66 },
  { name: 'DeDust Liquidity Pool', pct: 20.00 },
  { name: 'DCBM Reserve',          pct:  8.34 },
  { name: 'Team & Development',    pct:  5.00 },
];

const TOTAL_SUPPLY = 9000;

describe('TokenomicsChart — distribution integrity', () => {
  it('has exactly 4 allocation buckets', () => {
    expect(DISTRIBUTION).toHaveLength(4);
  });

  it('percentages sum to 100%', () => {
    const sum = DISTRIBUTION.reduce((s, d) => s + d.pct, 0);
    expect(sum).toBeCloseTo(100, 1);
  });

  it('mining rewards is the largest allocation (>50%)', () => {
    const largest = [...DISTRIBUTION].sort((a, b) => b.pct - a.pct)[0];
    expect(largest.name).toBe('Mining Rewards (90yr)');
    expect(largest.pct).toBeGreaterThan(50);
  });

  it('all percentages are positive', () => {
    DISTRIBUTION.forEach(d => expect(d.pct).toBeGreaterThan(0));
  });

  it('all percentages are less than 100', () => {
    DISTRIBUTION.forEach(d => expect(d.pct).toBeLessThan(100));
  });

  it('CET token amount from pct is correct', () => {
    const miningCET = (66.66 / 100) * TOTAL_SUPPLY;
    expect(miningCET).toBeCloseTo(5999.4, 0);
  });

  it('team allocation is exactly 5%', () => {
    const team = DISTRIBUTION.find(d => d.name === 'Team & Development');
    expect(team?.pct).toBe(5.00);
  });

  it('DCBM reserve + team = 13.34%', () => {
    const dcbm = DISTRIBUTION.find(d => d.name === 'DCBM Reserve')!;
    const team = DISTRIBUTION.find(d => d.name === 'Team & Development')!;
    expect(dcbm.pct + team.pct).toBeCloseTo(13.34, 1);
  });
});

// ─── AgentDepartmentChart — data integrity ────────────────────────────────

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

describe('AgentDepartmentChart — data integrity', () => {
  it('has exactly 10 departments', () => {
    expect(DEPT_DATA).toHaveLength(10);
  });

  it('total agents sums to 200,000', () => {
    expect(TOTAL_AGENTS).toBe(200_000);
  });

  it('Customer Ops is the largest department', () => {
    const largest = [...DEPT_DATA].sort((a, b) => b.agents - a.agents)[0];
    expect(largest.name).toBe('Customer Ops');
  });

  it('Research is the smallest department', () => {
    const smallest = [...DEPT_DATA].sort((a, b) => a.agents - b.agents)[0];
    expect(smallest.name).toBe('Research');
  });

  it('all agent counts are positive', () => {
    DEPT_DATA.forEach(d => expect(d.agents).toBeGreaterThan(0));
  });

  it('all agent counts are multiples of 1000', () => {
    DEPT_DATA.forEach(d => expect(d.agents % 1000).toBe(0));
  });

  it('top 3 departments account for >50% of agents', () => {
    const top3 = [...DEPT_DATA].sort((a, b) => b.agents - a.agents).slice(0, 3);
    const top3Total = top3.reduce((s, d) => s + d.agents, 0);
    expect(top3Total / TOTAL_AGENTS).toBeGreaterThan(0.5);
  });
});
