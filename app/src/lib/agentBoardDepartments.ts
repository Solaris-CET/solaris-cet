import { solarisDepartments } from '@/data/solarisDepartments';
import { MESH_ID_TO_AGENT_BOARD_LABEL } from '@/lib/agentBoardSkillMix';

/** Synthetic agent ID prefix per mesh department (CX-00423, …). */
const MESH_ID_TO_BOARD_SHORT: Record<string, string> = {
  'customer-ops': 'CX',
  engineering: 'ENG',
  sales: 'SLS',
  'data-intelligence': 'AI',
  finance: 'FIN',
  marketing: 'MKT',
  'product-design': 'PRD',
  security: 'SEC',
  legal: 'LGL',
  research: 'R&D',
};

export interface AgentBoardDepartmentRow {
  /** Board / chart label — must match keys of `AGENT_BOARD_DEPT_TO_MESH_ID` (agentBoardSkillMix). */
  name: string;
  short: string;
  agents: number;
  meshId: string;
}

function buildAgentBoardDepartments(): AgentBoardDepartmentRow[] {
  return solarisDepartments.map((d) => {
    const label = MESH_ID_TO_AGENT_BOARD_LABEL[d.id];
    const short = MESH_ID_TO_BOARD_SHORT[d.id];
    if (!label || !short) {
      throw new Error(`agentBoardDepartments: missing board label or short for mesh id "${d.id}"`);
    }
    return { meshId: d.id, name: label, short, agents: d.agentCount };
  });
}

/** Single source for live board event generator + tests — headcount from {@link solarisDepartments}. */
export const AGENT_BOARD_DEPARTMENTS: AgentBoardDepartmentRow[] = buildAgentBoardDepartments();
