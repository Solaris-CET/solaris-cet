import { solarisDepartments } from '@/data/solarisDepartments';
import { AGENT_BOARD_DEPT_TO_MESH_ID } from '@/lib/agentBoardSkillMix';
import { synthesizeMeshSkills, type SynthesisTier } from '@/lib/skillGenome';

const FEED_TIERS: SynthesisTier[] = ['flash', 'deep', 'standard'];

/**
 * Terminal-style line: real role + recombinant tier bound to department mesh data.
 */
export function expressMeshSkillForFeed(seq: number): { dept: string; line: string } {
  const d = solarisDepartments[seq % solarisDepartments.length]!;
  const role = d.roles[seq % d.roles.length]!;
  const tier = FEED_TIERS[seq % FEED_TIERS.length]!;
  const synth = synthesizeMeshSkills(d.id, role.title, role.skills, 1, tier)[0] ?? '';
  const t = new Date().toISOString().slice(11, 23);
  const full = `${role.title}: ${synth}`;
  const expr = full.slice(0, 200);
  const ell = full.length > 200 ? '…' : '';
  return {
    dept: d.id,
    line: `[${t}] [SKILL_MESH] dept=${d.id} tier=${tier} expr="${expr}${ell}"`,
  };
}

/** Short human line for whispers / captions (flash tier). */
export function shortSkillWhisper(seq: number): string {
  const d = solarisDepartments[seq % solarisDepartments.length]!;
  const role = d.roles[(seq * 7) % d.roles.length]!;
  const synth = synthesizeMeshSkills(d.id, role.title, role.skills, 1, 'flash')[0] ?? '';
  const out = `${role.title} — ${synth}`;
  return out.length <= 130 ? out : `${out.slice(0, 127)}…`;
}

/** One-line deep-tier fragment under a department bar (deterministic per tick). */
export function skillCaptionForDept(deptId: string, tick: number): string {
  const d = solarisDepartments.find((x) => x.id === deptId);
  if (!d) return '';
  const role = d.roles[tick % d.roles.length]!;
  const synth = synthesizeMeshSkills(d.id, role.title, role.skills, 1, 'deep')[0] ?? '';
  return synth.length <= 84 ? synth : `${synth.slice(0, 83)}…`;
}

/**
 * Standard-tier single line for one-shot UI bursts (e.g. unlock overlays).
 * Deterministic for the same seq.
 */
export function standardSkillBurst(seq: number): string {
  const d = solarisDepartments[seq % solarisDepartments.length]!;
  const role = d.roles[(seq * 11) % d.roles.length]!;
  const synth = synthesizeMeshSkills(d.id, role.title, role.skills, 1, 'standard')[0] ?? '';
  const raw = `${role.title}: ${synth}`;
  return raw.length <= 118 ? raw : `${raw.slice(0, 117)}…`;
}

/**
 * Flash-tier sample for UI tooltips keyed by the same display names as AgentBoard / radial chart.
 */
export function skillFlashForBoardDept(deptDisplayName: string, salt: number): string | null {
  const meshId = AGENT_BOARD_DEPT_TO_MESH_ID[deptDisplayName];
  if (!meshId) return null;
  const dept = solarisDepartments.find((d) => d.id === meshId);
  if (!dept) return null;
  const role = dept.roles[Math.abs(salt) % dept.roles.length]!;
  const line = synthesizeMeshSkills(meshId, role.title, role.skills, 1, 'flash')[0] ?? '';
  const raw = `${role.title}: ${line}`;
  return raw.length <= 96 ? raw : `${raw.slice(0, 95)}…`;
}

/** Stable small integer from a metric label (for benchmark tooltip skill lines). */
export function skillSeedFromLabel(label: string): number {
  let h = 0;
  for (let i = 0; i < label.length; i++) {
    h = (h * 33 + label.charCodeAt(i)) >>> 0;
  }
  return h % 900;
}

/** Deterministic salt from user query text (reasoning UI, demos). */
export function skillSaltFromQuery(q: string): number {
  let h = 2166136261;
  const s = q.trim();
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 600;
}
