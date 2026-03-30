import { describe, it, expect } from 'vitest';
import {
  ORACLE_BURST_SALT,
  buildRavBurstLogMessage,
  buildFlashGlintLogMessage,
  buildExpressomeBurstLogMessage,
  buildConsensusBurstLogMessage,
  buildLoopCompleteBurstLogMessage,
} from '@/lib/oracleBurstLines';

describe('oracleBurstLines', () => {
  const q = 'What is the RAV Protocol?';

  it.each([
    ['RAV_BURST', buildRavBurstLogMessage],
    ['FLASH_GLINT', buildFlashGlintLogMessage],
    ['EXPRESSOME_BURST', buildExpressomeBurstLogMessage],
    ['CONSENSUS_BURST', buildConsensusBurstLogMessage],
    ['LOOP_COMPLETE_BURST', buildLoopCompleteBurstLogMessage],
  ] as const)('%s: stable for same query and correct prefix', (prefix, fn) => {
    const a = fn(q);
    const b = fn(q);
    expect(a).toBe(b);
    expect(a.startsWith(`${prefix}: `)).toBe(true);
  });

  it('different queries yield different RAV burst', () => {
    expect(buildRavBurstLogMessage('aaa')).not.toBe(buildRavBurstLogMessage('bbb'));
  });

  it('FLASH_GLINT contains em dash (flash whisper shape)', () => {
    expect(buildFlashGlintLogMessage(q)).toContain('—');
  });

  it('ORACLE_BURST_SALT has five lifecycle keys', () => {
    expect(Object.keys(ORACLE_BURST_SALT).sort()).toEqual(
      ['consensus', 'expressome', 'observeCtx', 'oracleComplete', 'ravInit'].sort()
    );
  });
});
