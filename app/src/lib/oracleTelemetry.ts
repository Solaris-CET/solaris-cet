/**
 * Oracle RAV terminal: mesh lattice lines, agent pool / team whispers, and QUANTUM burst lines.
 * Re-exports split modules for one import path from UI and tests.
 */
import {
  ORACLE_LATTICE_PHASE,
  buildAgentPoolMeshLogMessage,
  buildDeepLatticeMeshLogMessage,
  buildSkillLocusLogMessage,
  buildTeamAgentMeshLogMessage,
} from './oracleMeshLines';
import { buildRavBurstLogMessage } from './oracleBurstLines';

export * from './oracleMeshLines';
export * from './oracleBurstLines';

/** Static INFO line after RAV_BURST in observe_parse — terminal treats as SKILL row. */
export const ORACLE_TASK_MESH_LINE =
  'TASK_MESH: ~200k task agents · delegated sub-queries · Oracle consolidation';

/**
 * Ordered telemetry strings for the synchronous `observe_parse` block after `RAV_INIT`:
 * `[0]` = QUANTUM `RAV_BURST`, remainder = INFO lines through `PARSE_MESH` (includes `INPUT_STREAM`).
 */
export function buildOracleObserveParseSequence(
  q: string,
  detected: string,
  tokenCount: number
): string[] {
  const out: string[] = [
    buildRavBurstLogMessage(q),
    ORACLE_TASK_MESH_LINE,
    buildAgentPoolMeshLogMessage(detected, q),
  ];
  if (detected === 'team' || detected === 'ai') {
    out.push(buildTeamAgentMeshLogMessage(q, detected));
  }
  out.push(
    `INPUT_STREAM: "${q}" · Tokens: ${tokenCount}`,
    buildDeepLatticeMeshLogMessage('INPUT_MESH', q, ORACLE_LATTICE_PHASE.inputStream),
    buildSkillLocusLogMessage(q, detected),
    buildDeepLatticeMeshLogMessage('PARSE_MESH', q, ORACLE_LATTICE_PHASE.observeParse)
  );
  return out;
}
