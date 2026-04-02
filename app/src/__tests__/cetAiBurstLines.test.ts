import { describe, it, expect } from 'vitest';
import {
  CET_AI_BURST_SALT,
  buildRavBurstLogMessage,
  buildFlashGlintLogMessage,
  buildExpressomeBurstLogMessage,
  buildConsensusBurstLogMessage,
  buildLoopCompleteBurstLogMessage,
} from '@/lib/cetAiBurstLines';

describe('cetAiBurstLines', () => {
  const q = 'What is the RAV Protocol?';

  const BUILDERS = [
    ['RAV_BURST', buildRavBurstLogMessage],
    ['FLASH_GLINT', buildFlashGlintLogMessage],
    ['EXPRESSOME_BURST', buildExpressomeBurstLogMessage],
    ['CONSENSUS_BURST', buildConsensusBurstLogMessage],
    ['LOOP_COMPLETE_BURST', buildLoopCompleteBurstLogMessage],
  ] as const;

  it('stable per query, correct prefix, query sensitivity, flash em dash, salt keys', () => {
    for (const [prefix, fn] of BUILDERS) {
      const a = fn(q);
      const b = fn(q);
      expect(a).toBe(b);
      expect(a.startsWith(`${prefix}: `)).toBe(true);
    }
    expect(buildRavBurstLogMessage('aaa')).not.toBe(buildRavBurstLogMessage('bbb'));
    expect(buildFlashGlintLogMessage(q)).toContain('—');
    expect(Object.keys(CET_AI_BURST_SALT).sort()).toEqual(
      ['cetAiComplete', 'consensus', 'expressome', 'observeCtx', 'ravInit'].sort()
    );
  });
});
