import { describe, expect,it } from 'vitest';

import { solarisDepartments } from '@/data/solarisDepartments';
import { MESH_ID_TO_AGENT_BOARD_LABEL } from '@/lib/agentBoardSkillMix';

describe('solarisDepartments — agent mesh registry', () => {
  it('every registry dept has an AgentBoard / chart short label', () => {
    solarisDepartments.forEach((d) => {
      expect(MESH_ID_TO_AGENT_BOARD_LABEL[d.id], d.id).toBeTruthy();
    });
  });

  it('10 depts, 200k agents, roles/skills invariants, global uniqueness', () => {
    expect(solarisDepartments).toHaveLength(10);
    const total = solarisDepartments.reduce((s, d) => s + d.agentCount, 0);
    expect(total).toBe(200_000);

    solarisDepartments.forEach((d) => {
      expect(d.roles.length).toBeGreaterThan(0);
      d.roles.forEach((r) => {
        expect(r.skills.length).toBeGreaterThanOrEqual(16);
        const set = new Set(r.skills);
        expect(set.size, `${d.id} / ${r.title}`).toBe(r.skills.length);
      });
      const titles = d.roles.map((r) => r.title);
      expect(new Set(titles).size).toBe(titles.length);
    });

    const seen = new Map<string, string>();
    solarisDepartments.forEach((d) => {
      d.roles.forEach((r) => {
        r.skills.forEach((s) => {
          const prev = seen.get(s);
          expect(prev, `Duplicate skill: "${s}" also in ${prev}`).toBeUndefined();
          seen.set(s, `${d.id} / ${r.title}`);
        });
      });
    });
  });
});
