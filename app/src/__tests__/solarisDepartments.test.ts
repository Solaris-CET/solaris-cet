import { describe, it, expect } from 'vitest';
import { solarisDepartments } from '@/data/solarisDepartments';

describe('solarisDepartments — agent mesh registry', () => {
  it('has exactly 10 departments', () => {
    expect(solarisDepartments).toHaveLength(10);
  });

  it('sums to 200,000 agents', () => {
    const t = solarisDepartments.reduce((s, d) => s + d.agentCount, 0);
    expect(t).toBe(200_000);
  });

  it('every department has at least one role with skills', () => {
    solarisDepartments.forEach(d => {
      expect(d.roles.length).toBeGreaterThan(0);
      d.roles.forEach(r => {
        expect(r.skills.length).toBeGreaterThanOrEqual(16);
      });
    });
  });

  it('every skill string is unique across the entire mesh (no shared wording)', () => {
    const seen = new Map<string, string>();
    solarisDepartments.forEach(d => {
      d.roles.forEach(r => {
        r.skills.forEach(s => {
          const prev = seen.get(s);
          expect(prev, `Duplicate skill: "${s}" also in ${prev}`).toBeUndefined();
          seen.set(s, `${d.id} / ${r.title}`);
        });
      });
    });
  });

  it('skills are unique within each role (no duplicate chips)', () => {
    solarisDepartments.forEach(d => {
      d.roles.forEach(r => {
        const set = new Set(r.skills);
        expect(set.size, `${d.id} / ${r.title}`).toBe(r.skills.length);
      });
    });
  });

  it('role titles are unique within each department', () => {
    solarisDepartments.forEach(d => {
      const titles = d.roles.map(r => r.title);
      expect(new Set(titles).size).toBe(titles.length);
    });
  });
});
