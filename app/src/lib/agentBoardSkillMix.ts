import { solarisDepartments } from '@/data/solarisDepartments';
import { type SynthesisTier,synthesizeMeshSkills } from '@/lib/skillGenome';

/** AgentBoard / charts: display `dept.name` → `solarisDepartments.id` */
export const AGENT_BOARD_DEPT_TO_MESH_ID: Record<string, string> = {
  'Customer Ops': 'customer-ops',
  Engineering: 'engineering',
  Sales: 'sales',
  'Data & AI': 'data-intelligence',
  Finance: 'finance',
  Marketing: 'marketing',
  Product: 'product-design',
  Security: 'security',
  Legal: 'legal',
  Research: 'research',
};

/** Inverse of {@link AGENT_BOARD_DEPT_TO_MESH_ID} — one board label per mesh id. */
export const MESH_ID_TO_AGENT_BOARD_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(AGENT_BOARD_DEPT_TO_MESH_ID).map(([label, id]) => [id, label])
);

const MAX_BOARD_LEN = 158;

export function truncateBoardSkillMessage(s: string): string {
  return s.length <= MAX_BOARD_LEN ? s : `${s.slice(0, MAX_BOARD_LEN - 1)}…`;
}

export interface SkillLatticePayload {
  line: string;
  roleTitle: string;
  meshDeptId: string;
}

/**
 * Recombinant skill payload for the live board — includes role id for per-agent mesh keys.
 */
export function buildSkillLatticePayload(deptName: string, seq: number): SkillLatticePayload | null {
  const meshId = AGENT_BOARD_DEPT_TO_MESH_ID[deptName];
  const dept = solarisDepartments.find((d) => d.id === meshId);
  if (!dept) return null;

  const role = dept.roles[seq % dept.roles.length];
  if (!role) return null;

  const tiers: SynthesisTier[] = ['deep', 'standard', 'flash'];
  const tier = tiers[seq % tiers.length]!;
  const line = synthesizeMeshSkills(meshId, role.title, role.skills, 1, tier)[0];
  if (!line) return null;

  const raw = `${role.title}: ${line}`;
  return {
    line: truncateBoardSkillMessage(raw),
    roleTitle: role.title,
    meshDeptId: meshId,
  };
}

/**
 * One recombinant skill line for the live agent board, keyed by dept + monotonic seq.
 */
export function buildSkillLatticeLine(deptName: string, seq: number): string | null {
  return buildSkillLatticePayload(deptName, seq)?.line ?? null;
}
