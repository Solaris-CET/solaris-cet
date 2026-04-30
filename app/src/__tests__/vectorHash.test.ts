import { describe, expect, it } from 'vitest';

import { cosineSimilarity, hashEmbedding } from '../../api/lib/vectorHash';

describe('vectorHash', () => {
  it('produces deterministic embeddings', () => {
    const a = hashEmbedding('hello world', 64);
    const b = hashEmbedding('hello world', 64);
    expect(a).toEqual(b);
  });

  it('has higher similarity for identical text than unrelated', () => {
    const a = hashEmbedding('cet tokenomics fixed supply', 128);
    const b = hashEmbedding('cet tokenomics fixed supply', 128);
    const c = hashEmbedding('banana sandwich recipe', 128);
    expect(cosineSimilarity(a, b)).toBeGreaterThan(cosineSimilarity(a, c));
  });
});

