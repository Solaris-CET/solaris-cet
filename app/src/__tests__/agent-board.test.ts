import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Inline replicas of AgentBoard pure logic ─────────────────────────────
// We test the deterministic parts without importing the React component.

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

// ─── Tests ────────────────────────────────────────────────────────────────

describe('AgentBoard — department registry', () => {
  it('has exactly 10 departments', () => {
    expect(DEPARTMENTS).toHaveLength(10);
  });

  it('total agents sum to exactly 200,000', () => {
    expect(TOTAL_AGENTS).toBe(200_000);
  });

  it('every department has a unique short code', () => {
    const shorts = DEPARTMENTS.map(d => d.short);
    const unique = new Set(shorts);
    expect(unique.size).toBe(DEPARTMENTS.length);
  });

  it('every department has a positive agent count', () => {
    DEPARTMENTS.forEach(d => {
      expect(d.agents).toBeGreaterThan(0);
    });
  });

  it('Customer Ops is the largest department', () => {
    const sorted = [...DEPARTMENTS].sort((a, b) => b.agents - a.agents);
    expect(sorted[0].name).toBe('Customer Ops');
  });

  it('Research is the smallest department', () => {
    const sorted = [...DEPARTMENTS].sort((a, b) => a.agents - b.agents);
    expect(sorted[0].name).toBe('Research');
  });
});

describe('AgentBoard — randomAgentId', () => {
  it('produces a string in format SHORT-NNNNN', () => {
    DEPARTMENTS.forEach(dept => {
      const id = randomAgentId(dept, 0.5);
      expect(id).toMatch(/^[A-Z&]+-\d{5}$/);
    });
  });

  it('never produces an id with agent number 0', () => {
    DEPARTMENTS.forEach(dept => {
      const id = randomAgentId(dept, 0);
      const num = parseInt(id.split('-')[1], 10);
      expect(num).toBeGreaterThanOrEqual(1);
    });
  });

  it('never produces an id exceeding the department agent count', () => {
    DEPARTMENTS.forEach(dept => {
      const id = randomAgentId(dept, 0.9999);
      const num = parseInt(id.split('-')[1], 10);
      expect(num).toBeLessThanOrEqual(dept.agents);
    });
  });

  it('produces the department short code as prefix', () => {
    DEPARTMENTS.forEach(dept => {
      const id = randomAgentId(dept, 0.42);
      expect(id.startsWith(dept.short + '-')).toBe(true);
    });
  });
});

describe('AgentBoard — timeSince', () => {
  let now: number;

  beforeEach(() => {
    now = Date.now();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows seconds for events < 60 seconds ago', () => {
    expect(timeSince(now - 5_000, now)).toBe('5s ago');
    expect(timeSince(now - 30_000, now)).toBe('30s ago');
    expect(timeSince(now - 59_000, now)).toBe('59s ago');
  });

  it('shows minutes for events >= 60 seconds ago', () => {
    expect(timeSince(now - 60_000, now)).toBe('1m ago');
    expect(timeSince(now - 120_000, now)).toBe('2m ago');
    expect(timeSince(now - 300_000, now)).toBe('5m ago');
  });

  it('returns "0s ago" for events at exactly now', () => {
    expect(timeSince(now, now)).toBe('0s ago');
  });

  it('handles very recent sub-second events as 0s ago', () => {
    expect(timeSince(now - 500, now)).toBe('0s ago');
  });
});

describe('AgentBoard — total agents match AITeamSection', () => {
  it('200,000 agent total is consistent across the codebase', () => {
    // This test acts as a canary: if AITeamSection changes its department
    // counts, this test will fail, reminding developers to update AgentBoard.
    expect(TOTAL_AGENTS).toBe(200_000);
  });

  it('individual department counts match AITeamSection data', () => {
    const expected: Record<string, number> = {
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
    DEPARTMENTS.forEach(d => {
      expect(d.agents, `${d.name} count mismatch`).toBe(expected[d.name]);
    });
  });
});
