import { describe, it, expect, vi, afterEach } from 'vitest';

interface Dept {
  name: string;
  short: string;
  agents: number;
}

const DEPARTMENTS: Dept[] = [
  { name: 'Customer Ops', short: 'CX',  agents: 48_000 },
  { name: 'Engineering',  short: 'ENG', agents: 34_000 },
  { name: 'Sales',        short: 'SLS', agents: 27_000 },
  { name: 'Data & AI',    short: 'AI',  agents: 21_000 },
  { name: 'Finance',      short: 'FIN', agents: 18_000 },
  { name: 'Marketing',    short: 'MKT', agents: 17_000 },
  { name: 'Product',      short: 'PRD', agents: 13_000 },
  { name: 'Security',     short: 'SEC', agents: 10_000 },
  { name: 'Legal',        short: 'LGL', agents: 7_000  },
  { name: 'Research',     short: 'R&D', agents: 5_000  },
];

const TOTAL_AGENTS = DEPARTMENTS.reduce((sum, d) => sum + d.agents, 0);

function randomAgentId(dept: Dept, seed = Math.random()): string {
  const id = Math.floor(seed * dept.agents) + 1;
  return `${dept.short}-${String(id).padStart(5, '0')}`;
}

function timeSince(ts: number, now: number): string {
  const s = Math.floor((now - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

const EXPECTED_COUNTS: Record<string, number> = {
  'Customer Ops': 48_000,
  'Engineering':  34_000,
  'Sales':        27_000,
  'Data & AI':    21_000,
  'Finance':      18_000,
  'Marketing':    17_000,
  'Product':      13_000,
  'Security':     10_000,
  'Legal':         7_000,
  'Research':      5_000,
};

describe('AgentBoard — inline pure logic', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registry, randomAgentId, timeSince, AITeam counts', () => {
    expect(DEPARTMENTS).toHaveLength(10);
    expect(TOTAL_AGENTS).toBe(200_000);
    const shorts = DEPARTMENTS.map((d) => d.short);
    expect(new Set(shorts).size).toBe(DEPARTMENTS.length);
    DEPARTMENTS.forEach((d) => {
      expect(d.agents).toBeGreaterThan(0);
      expect(d.agents, `${d.name} count mismatch`).toBe(EXPECTED_COUNTS[d.name]);
    });
    const byAgents = [...DEPARTMENTS].sort((a, b) => b.agents - a.agents);
    expect(byAgents[0].name).toBe('Customer Ops');
    expect([...DEPARTMENTS].sort((a, b) => a.agents - b.agents)[0].name).toBe('Research');

    DEPARTMENTS.forEach((dept) => {
      expect(randomAgentId(dept, 0.5)).toMatch(/^[A-Z&]+-\d{5}$/);
      expect(parseInt(randomAgentId(dept, 0).split('-')[1], 10)).toBeGreaterThanOrEqual(1);
      expect(parseInt(randomAgentId(dept, 0.9999).split('-')[1], 10)).toBeLessThanOrEqual(dept.agents);
      expect(randomAgentId(dept, 0.42).startsWith(`${dept.short}-`)).toBe(true);
    });

    const now = Date.now();
    expect(timeSince(now - 5_000, now)).toBe('5s ago');
    expect(timeSince(now - 30_000, now)).toBe('30s ago');
    expect(timeSince(now - 59_000, now)).toBe('59s ago');
    expect(timeSince(now - 60_000, now)).toBe('1m ago');
    expect(timeSince(now - 120_000, now)).toBe('2m ago');
    expect(timeSince(now - 300_000, now)).toBe('5m ago');
    expect(timeSince(now, now)).toBe('0s ago');
    expect(timeSince(now - 500, now)).toBe('0s ago');
  });
});
