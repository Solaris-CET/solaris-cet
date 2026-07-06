import { describe, expect,it } from 'vitest';

import type { Translations } from '@/i18n/translations';
import {
  buildCopyForAiText,
  buildFullConversationHandoff,
  type CetAiChatEntry,
} from '@/lib/cetAiConversation';

const mockCetAi = {
  copyForAiQuestionLabel: '## Question',
  copyForAiAnswerLabel: '## Answer',
  copyForAiInstructions: '--- end ---',
} as Translations['cetAi'];

describe('cetAiConversation', () => {
  it('buildCopyForAiText formats labels and instructions', () => {
    const s = buildCopyForAiText('Q1', 'A1', mockCetAi);
    expect(s).toContain('## Question');
    expect(s).toContain('Q1');
    expect(s).toContain('## Answer');
    expect(s).toContain('A1');
    expect(s).toContain('--- end ---');
  });

  it('buildFullConversationHandoff joins turns with ---', () => {
    const history: CetAiChatEntry[] = [
      { question: 'First?', answer: 'First.', confidence: 90 },
    ];
    const out = buildFullConversationHandoff(history, 'Second?', 'Second.', mockCetAi);
    expect(out).toContain('\n\n---\n\n');
    expect(out).toContain('First?');
    expect(out).toContain('Second?');
    expect(out.indexOf('First?')).toBeLessThan(out.indexOf('Second?'));
  });
});
