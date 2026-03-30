import { meshStandardBurstFromKey, meshWhisperFromKey, skillSeedFromLabel } from '@/lib/meshSkillFeed';

/**
 * Full telemetry line for Oracle terminal (INFO) — matches `AGENT_POOL_MESH:` prefix in AiOracleSearch.
 */
export function buildAgentPoolMeshLogMessage(detectedTopic: string, query: string): string {
  return `AGENT_POOL_MESH: ${meshStandardBurstFromKey(`oracle|agentPool|${detectedTopic}|${skillSeedFromLabel(query)}`)}`;
}

/**
 * Full telemetry line for Oracle terminal — `TEAM_AGENT_MESH:` (team / ai topics).
 */
export function buildTeamAgentMeshLogMessage(query: string, detectedTopic: string): string {
  return `TEAM_AGENT_MESH: ${meshWhisperFromKey(`oracle|teamAgent|${query}|${detectedTopic}`)}`;
}
