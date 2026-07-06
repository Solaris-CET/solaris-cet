import { solarisDepartments } from '@/data/solarisDepartments';
import { AGENT_BOARD_DEPT_TO_MESH_ID } from '@/lib/agentBoardSkillMix';
import { type SynthesisTier,synthesizeMeshSkills } from '@/lib/skillGenome';

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

export type ObserveLocusBranch = 'ai' | 'price' | 'mining' | 'ton' | 'default';

const LOCUS_BRANCH_BIAS: Record<ObserveLocusBranch, number> = {
  ai: 0,
  price: 19,
  mining: 37,
  ton: 53,
  default: 71,
};

/** Truncated flash whisper for reasoning OBSERVE step — stable per query + branch. */
export function observeLocusClip(q: string, branch: ObserveLocusBranch): string {
  const frag = shortSkillWhisper(skillSaltFromQuery(q) + LOCUS_BRANCH_BIAS[branch]);
  return frag.length > 76 ? `${frag.slice(0, 73)}…` : frag;
}

/** Map Oracle / topic detector labels to locus branches. */
export function observeLocusBranchFromTopic(topic: string): ObserveLocusBranch {
  if (topic === 'price') return 'price';
  if (topic === 'mining') return 'mining';
  if (topic === 'ton') return 'ton';
  if (topic === 'ai' || topic === 'rav' || topic === 'braid' || topic === 'team') return 'ai';
  return 'default';
}

/** Deep lattice fragment: mesh dept (by query hash) + deep-tier caption — Oracle / verify lines. */
export function deepLatticeLineForQuery(q: string): string {
  const dept = solarisDepartments[skillSaltFromQuery(q) % solarisDepartments.length]!;
  const tick = skillSeedFromLabel(`${q}|deepLattice`);
  const inner = skillCaptionForDept(dept.id, tick);
  const raw = `${dept.id} · ${inner}`;
  return raw.length <= 102 ? raw : `${raw.slice(0, 99)}…`;
}

/** Flash whisper from a stable scene key — counter tooltips and ambient hooks. */
export function meshWhisperFromKey(sceneKey: string): string {
  return shortSkillWhisper(skillSeedFromLabel(sceneKey));
}

/** Standard-tier burst from a stable scene key — longer tooltips and panels. */
export function meshStandardBurstFromKey(sceneKey: string): string {
  return standardSkillBurst(skillSeedFromLabel(sceneKey));
}

// ─── AI Team: one mesh stream per unique role-agent + gene + synth slot ───

/** Scene key for a single department role-type agent (200k workforce slice). */
export function aiTeamRoleAgentKey(deptId: string, roleTitle: string): string {
  return `aiTeam|roleAgent|${deptId}|${roleTitle}`;
}

/** Scene key for one curated gene index under that role. */
export function aiTeamRoleGeneKey(deptId: string, roleTitle: string, geneIndex: number): string {
  return `aiTeam|roleGene|${deptId}|${geneIndex}|${roleTitle}`;
}

/** Scene key for one recombinant synth chip (tier A/B/C in RoleSynthesizedSkills). */
export function aiTeamSynthKey(
  deptId: string,
  roleTitle: string,
  tier: SynthesisTier,
  index: number
): string {
  return `aiTeam|synth|${deptId}|${tier}|${index}|${roleTitle}`;
}

/** Flash whisper tied to that role agent identity. */
export function meshWhisperForAiTeamRoleAgent(deptId: string, roleTitle: string): string {
  return meshWhisperFromKey(aiTeamRoleAgentKey(deptId, roleTitle));
}

/** Standard burst for role row tooltips (summary / hover). */
export function meshStandardBurstForAiTeamRoleAgent(deptId: string, roleTitle: string): string {
  return meshStandardBurstFromKey(aiTeamRoleAgentKey(deptId, roleTitle));
}

/** Flash whisper per curated gene chip. */
export function meshWhisperForAiTeamRoleGene(
  deptId: string,
  roleTitle: string,
  geneIndex: number
): string {
  return meshWhisperFromKey(aiTeamRoleGeneKey(deptId, roleTitle, geneIndex));
}

/** Flash whisper per synthesized expressome / deep / flash chip. */
export function meshWhisperForAiTeamSynth(
  deptId: string,
  roleTitle: string,
  tier: SynthesisTier,
  index: number
): string {
  return meshWhisperFromKey(aiTeamSynthKey(deptId, roleTitle, tier, index));
}

// ─── Live AgentBoard: numeric instance id + dept + kind (+ role when known) ───

/**
 * Stable key for one simulated agent row (e.g. CX-00423 + Customer Ops + learned).
 * Optional `messageFingerprint` (e.g. event message) differentiates two rows with the same id/kind.
 */
export function agentBoardLiveAgentKey(
  agentId: string,
  deptDisplayName: string,
  kind: string,
  roleTitle?: string,
  messageFingerprint?: string
): string {
  const role = roleTitle ?? '—';
  const msg =
    messageFingerprint != null && messageFingerprint.length > 0
      ? `|msg${skillSeedFromLabel(messageFingerprint)}`
      : '';
  return `agentBoard|liveAgent|${agentId}|${deptDisplayName}|${kind}|${role}${msg}`;
}

export function meshWhisperForBoardLiveAgent(
  agentId: string,
  deptDisplayName: string,
  kind: string,
  roleTitle?: string,
  messageFingerprint?: string
): string {
  return meshWhisperFromKey(
    agentBoardLiveAgentKey(agentId, deptDisplayName, kind, roleTitle, messageFingerprint)
  );
}

export function meshStandardBurstForBoardLiveAgent(
  agentId: string,
  deptDisplayName: string,
  kind: string,
  roleTitle?: string,
  messageFingerprint?: string
): string {
  return meshStandardBurstFromKey(
    agentBoardLiveAgentKey(agentId, deptDisplayName, kind, roleTitle, messageFingerprint)
  );
}

/** Peer agent in learned/collab lines — second identity stream. */
export function meshWhisperForBoardCollab(peerAgentId: string): string {
  return meshWhisperFromKey(`agentBoard|collab|${peerAgentId}`);
}

export function meshStandardBurstForBoardCollab(peerAgentId: string): string {
  return meshStandardBurstFromKey(`agentBoard|collab|${peerAgentId}`);
}
