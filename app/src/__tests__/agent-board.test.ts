import { afterEach,describe, expect, it, vi } from 'vitest';

import { AGENT_BOARD_DEPARTMENTS } from '@/lib/agentBoardDepartments';
import { TASK_AGENT_MESH_TOTAL } from '@/lib/domainPillars';

type Dept = (typeof AGENT_BOARD_DEPARTMENTS)[number];

const DEPARTMENTS = AGENT_BOARD_DEPARTMENTS;

const TOTAL_AGENTS = TASK_AGENT_MESH_TOTAL;

const SUM_FROM_ROWS = DEPARTMENTS.reduce((s, d) => s + d.agents, 0);

function randomAgentId(dept: Dept, seed = Math.random()): string {
  const id = Math.floor(seed * dept.agents) + 1;
  return `${dept.short}-${String(id).padStart(5, '0')}`;
}

function timeSince(ts: number, now: number): string {
  const s = Math.floor((now - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

describe('AgentBoard — inline pure logic', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registry, randomAgentId, timeSince, AITeam counts', () => {
    expect(DEPARTMENTS).toHaveLength(10);
    expect(TOTAL_AGENTS).toBe(200_000);
    expect(SUM_FROM_ROWS).toBe(TASK_AGENT_MESH_TOTAL);
    const shorts = DEPARTMENTS.map((d) => d.short);
    expect(new Set(shorts).size).toBe(DEPARTMENTS.length);
    DEPARTMENTS.forEach((d) => {
      expect(d.agents).toBeGreaterThan(0);
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
