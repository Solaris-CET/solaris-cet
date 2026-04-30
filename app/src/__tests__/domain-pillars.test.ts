import { describe, expect,it } from 'vitest';

import { solarisDepartments } from '@/data/solarisDepartments';
import { AGENT_BOARD_DEPARTMENTS } from '@/lib/agentBoardDepartments';
import { AGENT_BOARD_DEPT_TO_MESH_ID } from '@/lib/agentBoardSkillMix';
import {
  CET_FIXED_SUPPLY_CAP,
  ENTERPRISE_DEPARTMENT_LANES,
  TASK_AGENT_MESH_TOTAL,
} from '@/lib/domainPillars';

describe('domain pillars ↔ registry alignment', () => {
  it('CET cap and department / mesh totals match solarisDepartments', () => {
    expect(solarisDepartments).toHaveLength(ENTERPRISE_DEPARTMENT_LANES);
    const sumAgents = solarisDepartments.reduce((s, d) => s + d.agentCount, 0);
    expect(sumAgents).toBe(TASK_AGENT_MESH_TOTAL);

    const ids = new Set(solarisDepartments.map((d) => d.id));
    const boardIds = new Set(Object.values(AGENT_BOARD_DEPT_TO_MESH_ID));
    expect(boardIds.size).toBe(ENTERPRISE_DEPARTMENT_LANES);
    boardIds.forEach((id) => {
      expect(ids.has(id), `board maps to unknown mesh id: ${id}`).toBe(true);
    });

    expect(AGENT_BOARD_DEPARTMENTS).toHaveLength(ENTERPRISE_DEPARTMENT_LANES);
    expect(AGENT_BOARD_DEPARTMENTS.reduce((s, r) => s + r.agents, 0)).toBe(TASK_AGENT_MESH_TOTAL);
  });

  it('board display labels map 1:1 to registry ids', () => {
    for (const [label, meshId] of Object.entries(AGENT_BOARD_DEPT_TO_MESH_ID)) {
      const row = AGENT_BOARD_DEPARTMENTS.find((r) => r.name === label);
      expect(row, `no AGENT_BOARD_DEPARTMENTS row for label "${label}"`).toBeTruthy();
      expect(row!.meshId).toBe(meshId);
    }
  });

  it('CET supply cap is the documented fixed ceiling', () => {
    expect(CET_FIXED_SUPPLY_CAP).toBe(9_000);
  });
});
