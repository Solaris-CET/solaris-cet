/**
 * CET AI RAV terminal: mesh lattice lines, agent pool / team whispers, QUANTUM burst lines.
 */
import { buildRavBurstLogMessage } from './cetAiBurstLines';
import {
  buildAgentPoolMeshLogMessage,
  buildDeepLatticeMeshLogMessage,
  buildSkillLocusLogMessage,
  buildTeamAgentMeshLogMessage,
  CET_AI_LATTICE_PHASE,
} from './cetAiMeshLines';

export * from './cetAiBurstLines';
export * from './cetAiMeshLines';

export const CET_AI_TASK_MESH_LINE =
  'TASK_MESH: ~200k task agents · delegated sub-queries · CET AI consolidation';

/**
 * Ordered strings for the synchronous `observe_parse` block after `RAV_INIT`.
 */
export function buildCetAiObserveParse(q: string, detected: string, tokenCount: number): string[] {
  const out: string[] = [
    buildRavBurstLogMessage(q),
    CET_AI_TASK_MESH_LINE,
    buildAgentPoolMeshLogMessage(detected, q),
  ];
  if (detected === 'team' || detected === 'ai') {
    out.push(buildTeamAgentMeshLogMessage(q, detected));
  }
  out.push(
    `INPUT_STREAM: "${q}" · Tokens: ${tokenCount}`,
    buildDeepLatticeMeshLogMessage('INPUT_MESH', q, CET_AI_LATTICE_PHASE.inputStream),
    buildSkillLocusLogMessage(q, detected),
    buildDeepLatticeMeshLogMessage('PARSE_MESH', q, CET_AI_LATTICE_PHASE.observeParse)
  );
  return out;
}
