import { solarisDepartments } from '@/data/solarisDepartments';
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
