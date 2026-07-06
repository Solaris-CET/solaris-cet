import OpenAI from 'openai';

import { hashEmbedding } from './vectorHash';

export type EmbeddingProvider = 'hash' | 'openai';

export type EmbeddingResult = {
  provider: EmbeddingProvider;
  model: string;
  vector: number[];
};

function normalizeProvider(raw: string | undefined): EmbeddingProvider {
  const v = (raw ?? '').trim().toLowerCase();
  if (v === 'openai') return 'openai';
  return 'hash';
}

export function configuredEmbeddingProvider(): EmbeddingProvider {
  return normalizeProvider(process.env.CET_AI_EMBEDDINGS_PROVIDER);
}

export async function embedText(text: string, opts?: { provider?: EmbeddingProvider }): Promise<EmbeddingResult> {
  const provider = opts?.provider ?? configuredEmbeddingProvider();
  if (provider === 'openai') {
    const apiKey = (process.env.OPENAI_API_KEY ?? '').trim();
    if (!apiKey) {
      return { provider: 'hash', model: 'hash-256', vector: hashEmbedding(text, 256) };
    }
    const model = (process.env.CET_AI_OPENAI_EMBED_MODEL ?? 'text-embedding-3-small').trim() || 'text-embedding-3-small';
    const client = new OpenAI({ apiKey });
    const res = await client.embeddings.create({ model, input: text });
    const vec = res.data?.[0]?.embedding;
    if (!Array.isArray(vec) || vec.length === 0) {
      return { provider: 'hash', model: 'hash-256', vector: hashEmbedding(text, 256) };
    }
    return { provider: 'openai', model, vector: vec as unknown as number[] };
  }
  return { provider: 'hash', model: 'hash-256', vector: hashEmbedding(text, 256) };
}

