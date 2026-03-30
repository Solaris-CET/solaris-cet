import { shortSkillWhisper, skillSeedFromLabel, standardSkillBurst } from '@/lib/meshSkillFeed';

/** Salt segments appended as `\`${query}|${salt}\`` for stable seeds — keep aligned with legacy Oracle strings. */
export const ORACLE_BURST_SALT = {
  ravInit: 'ravInit',
  observeCtx: 'observeCtx',
  expressome: 'expressome',
  consensus: 'consensus',
  oracleComplete: 'oracleComplete',
} as const;

function burstKey(query: string, salt: string): string {
  return `${query}|${salt}`;
}

export function buildRavBurstLogMessage(query: string): string {
  return `RAV_BURST: ${standardSkillBurst(skillSeedFromLabel(burstKey(query, ORACLE_BURST_SALT.ravInit)))}`;
}

export function buildFlashGlintLogMessage(query: string): string {
  return `FLASH_GLINT: ${shortSkillWhisper(skillSeedFromLabel(burstKey(query, ORACLE_BURST_SALT.observeCtx)))}`;
}

export function buildExpressomeBurstLogMessage(query: string): string {
  return `EXPRESSOME_BURST: ${standardSkillBurst(skillSeedFromLabel(burstKey(query, ORACLE_BURST_SALT.expressome)))}`;
}

export function buildConsensusBurstLogMessage(query: string): string {
  return `CONSENSUS_BURST: ${standardSkillBurst(skillSeedFromLabel(burstKey(query, ORACLE_BURST_SALT.consensus)))}`;
}

export function buildLoopCompleteBurstLogMessage(query: string): string {
  return `LOOP_COMPLETE_BURST: ${standardSkillBurst(skillSeedFromLabel(burstKey(query, ORACLE_BURST_SALT.oracleComplete)))}`;
}
