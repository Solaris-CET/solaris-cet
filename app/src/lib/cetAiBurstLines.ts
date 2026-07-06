import { shortSkillWhisper, skillSeedFromLabel, standardSkillBurst } from '@/lib/meshSkillFeed';

/** Stable salt keys for RAV burst lines — Solaris CET–scoped seeds. */
export const CET_AI_BURST_SALT = {
  ravInit: 'ravInit',
  observeCtx: 'observeCtx',
  expressome: 'expressome',
  consensus: 'consensus',
  cetAiComplete: 'cetAiComplete',
} as const;

function burstKey(query: string, salt: string): string {
  return `${query}|${salt}`;
}

export function buildRavBurstLogMessage(query: string): string {
  return `RAV_BURST: ${standardSkillBurst(skillSeedFromLabel(burstKey(query, CET_AI_BURST_SALT.ravInit)))}`;
}

export function buildFlashGlintLogMessage(query: string): string {
  return `FLASH_GLINT: ${shortSkillWhisper(skillSeedFromLabel(burstKey(query, CET_AI_BURST_SALT.observeCtx)))}`;
}

export function buildExpressomeBurstLogMessage(query: string): string {
  return `EXPRESSOME_BURST: ${standardSkillBurst(skillSeedFromLabel(burstKey(query, CET_AI_BURST_SALT.expressome)))}`;
}

export function buildConsensusBurstLogMessage(query: string): string {
  return `CONSENSUS_BURST: ${standardSkillBurst(skillSeedFromLabel(burstKey(query, CET_AI_BURST_SALT.consensus)))}`;
}

export function buildLoopCompleteBurstLogMessage(query: string): string {
  return `LOOP_COMPLETE_BURST: ${standardSkillBurst(skillSeedFromLabel(burstKey(query, CET_AI_BURST_SALT.cetAiComplete)))}`;
}
