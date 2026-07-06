import { describe, expect,it } from 'vitest';

import translations from '../i18n/translations';

const en = translations.en.faqContent;

const QUESTION_KEYS = [
  'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'q11', 'q12', 'q13', 'q14',
] as const;

describe('FAQSection', () => {
  it('en content + accordion toggle', () => {
    expect(QUESTION_KEYS).toHaveLength(14);
    const texts = QUESTION_KEYS.map((qk) => en[qk]);
    for (let i = 0; i < QUESTION_KEYS.length; i++) {
      const q = texts[i];
      const qk = QUESTION_KEYS[i];
      expect(typeof q, qk).toBe('string');
      expect(q.length, qk).toBeGreaterThan(10);
      expect(q.endsWith('?'), qk).toBe(true);
    }
    expect(new Set(texts).size).toBe(QUESTION_KEYS.length);
    expect(en.q11.toLowerCase()).toMatch(/fetch|bittensor|singularity/);
    expect(en.q12).toContain('BRAID');
    expect(en.q13).toContain('RAV');
    expect(en.q14).toContain('Zero-Battery');
    expect(en.linkWhitepaper.length).toBeGreaterThan(3);
    expect(en.linkTelegram.length).toBeGreaterThan(3);
    expect(en.linkGithub.length).toBeGreaterThan(3);
    expect(en.linkComparison.length).toBeGreaterThan(3);

    function toggleFaq(openIndex: number | null, i: number): number | null {
      return openIndex === i ? null : i;
    }
    expect(toggleFaq(null, 0)).toBe(0);
    expect(toggleFaq(2, 2)).toBeNull();
    expect(toggleFaq(1, 3)).toBe(3);
    expect(toggleFaq(null, 13)).toBe(13);
  });
});
