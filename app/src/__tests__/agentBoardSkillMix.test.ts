import { describe, expect,it } from 'vitest';

import {
  AGENT_BOARD_DEPT_TO_MESH_ID,
  buildSkillLatticeLine,
  buildSkillLatticePayload,
  truncateBoardSkillMessage,
} from '@/lib/agentBoardSkillMix';

describe('agentBoardSkillMix', () => {
  it('mesh map, lattice lines/payload, truncation, unknown dept', () => {
    expect(Object.keys(AGENT_BOARD_DEPT_TO_MESH_ID)).toHaveLength(10);
    const line = buildSkillLatticeLine('Engineering', 7);
    expect(line).toBe(buildSkillLatticeLine('Engineering', 7));
    expect(line).toMatch(/^[^:]+:/);
    const p = buildSkillLatticePayload('Engineering', 4);
    expect(p).not.toBeNull();
    expect(p!.line).toBe(buildSkillLatticeLine('Engineering', 4));
    expect(p!.roleTitle.length).toBeGreaterThan(2);
    expect(p!.meshDeptId).toBe('engineering');
    expect(buildSkillLatticeLine('Sales', 0)).not.toBe(buildSkillLatticeLine('Sales', 1));
    const long = 'x'.repeat(200);
    expect(truncateBoardSkillMessage(long).length).toBeLessThanOrEqual(158);
    expect(truncateBoardSkillMessage(long).endsWith('…')).toBe(true);
    expect(buildSkillLatticeLine('Unknown Dept', 0)).toBeNull();
  });
});
