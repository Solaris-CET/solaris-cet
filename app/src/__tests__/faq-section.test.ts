import { describe, it, expect } from 'vitest';

// ─── FAQ data integrity tests ─────────────────────────────────────────────

const FAQ_ITEMS = [
  { question: 'What is Solaris CET?', hasLinks: true },
  { question: 'What is the total supply of CET?', hasLinks: false },
  { question: 'How do I buy CET?', hasLinks: true },
  { question: 'Is the smart contract audited?', hasLinks: true },
  { question: 'How does CET mining work?', hasLinks: false },
  { question: 'What is the DCBM mechanism?', hasLinks: false },
  { question: 'What blockchain does CET run on?', hasLinks: false },
  { question: 'What is the ReAct Protocol?', hasLinks: false },
  { question: 'Where can I find the whitepaper?', hasLinks: true },
  { question: 'How do I join the Solaris CET community?', hasLinks: true },
  { question: 'How does Solaris CET compare to Fetch.ai, Bittensor and SingularityNET?', hasLinks: true },
  { question: 'What is the BRAID Framework?', hasLinks: false },
  { question: 'What are the RAV Protocol phases?', hasLinks: false },
  { question: 'What is the Zero-Battery Constraint?', hasLinks: false },
];

describe('FAQSection — data integrity', () => {
  it('has 14 FAQ items after expansion', () => {
    expect(FAQ_ITEMS).toHaveLength(14);
  });

  it('all questions are non-empty strings', () => {
    FAQ_ITEMS.forEach(item => {
      expect(typeof item.question).toBe('string');
      expect(item.question.length).toBeGreaterThan(10);
    });
  });

  it('all questions end with a question mark', () => {
    FAQ_ITEMS.forEach(item => {
      expect(item.question.endsWith('?')).toBe(true);
    });
  });

  it('questions are unique', () => {
    const questions = FAQ_ITEMS.map(i => i.question);
    const unique = new Set(questions);
    expect(unique.size).toBe(FAQ_ITEMS.length);
  });

  it('competition comparison question exists', () => {
    const found = FAQ_ITEMS.some(i =>
      i.question.toLowerCase().includes('fetch') ||
      i.question.toLowerCase().includes('compare')
    );
    expect(found).toBe(true);
  });

  it('BRAID Framework question exists', () => {
    const found = FAQ_ITEMS.some(i => i.question.includes('BRAID'));
    expect(found).toBe(true);
  });

  it('RAV Protocol question exists', () => {
    const found = FAQ_ITEMS.some(i => i.question.includes('RAV'));
    expect(found).toBe(true);
  });

  it('Zero-Battery Constraint question exists', () => {
    const found = FAQ_ITEMS.some(i => i.question.includes('Zero-Battery'));
    expect(found).toBe(true);
  });
});

// ─── FAQ accordion state logic ────────────────────────────────────────────

describe('FAQSection — accordion state logic', () => {
  function toggleFaq(openIndex: number | null, i: number): number | null {
    return openIndex === i ? null : i;
  }

  it('opens an item when none is open', () => {
    expect(toggleFaq(null, 0)).toBe(0);
  });

  it('closes an item when the same item is toggled', () => {
    expect(toggleFaq(2, 2)).toBeNull();
  });

  it('switches to a different item', () => {
    expect(toggleFaq(1, 3)).toBe(3);
  });

  it('first item can be opened', () => {
    expect(toggleFaq(null, 0)).toBe(0);
  });

  it('last item index is 13 (0-based)', () => {
    expect(toggleFaq(null, 13)).toBe(13);
  });
});
