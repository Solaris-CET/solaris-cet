import {
  deepLatticeLineForQuery,
  meshStandardBurstFromKey,
  meshWhisperFromKey,
  observeLocusBranchFromTopic,
  observeLocusClip,
  skillSeedFromLabel,
} from '@/lib/meshSkillFeed';

/**
 * Suffixes for `deepLatticeLineForQuery(\`\${query}|\${phase}\`)` — keep in sync with `CetAiSearch`.
 */
export const CET_AI_LATTICE_PHASE = {
  inputStream: 'inputStream',
  observeParse: 'observeParse',
  observeContext: 'observeContext',
  thinkRoute: 'thinkRoute',
  thinkValidate: 'thinkValidate',
  actExecute: 'actExecute',
  verifyCross: 'verifyCross',
  meshSeal: 'meshSeal',
  sessionClose: 'sessionClose',
} as const;

export type CetAiLatticePhase = (typeof CET_AI_LATTICE_PHASE)[keyof typeof CET_AI_LATTICE_PHASE];

export function buildDeepLatticeMeshLogMessage(
  telemetryPrefix: string,
  query: string,
  latticePhase: CetAiLatticePhase | string
): string {
  return `${telemetryPrefix}: ${deepLatticeLineForQuery(`${query}|${latticePhase}`)}`;
}

export function buildDeepLatticeMeshLogMessageRawQuery(telemetryPrefix: string, query: string): string {
  return `${telemetryPrefix}: ${deepLatticeLineForQuery(query)}`;
}

export function buildSkillLocusLogMessage(query: string, detectedTopic: string): string {
  const branch = observeLocusBranchFromTopic(detectedTopic);
  return `SKILL_LOCUS: ${observeLocusClip(query, branch)} · topic=${detectedTopic}`;
}

export function buildAgentPoolMeshLogMessage(detectedTopic: string, query: string): string {
  return `AGENT_POOL_MESH: ${meshStandardBurstFromKey(`cetAi|agentPool|${detectedTopic}|${skillSeedFromLabel(query)}`)}`;
}

export function buildTeamAgentMeshLogMessage(query: string, detectedTopic: string): string {
  return `TEAM_AGENT_MESH: ${meshWhisperFromKey(`cetAi|teamAgent|${query}|${detectedTopic}`)}`;
}
