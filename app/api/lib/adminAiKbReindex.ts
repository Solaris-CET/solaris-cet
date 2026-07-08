import type { EmbeddingProvider } from './embeddings';

export const ADMIN_AI_KB_REINDEX_PATH = '/api/admin/ai/kb/reindex';
export const ADMIN_AI_KB_REINDEX_METHODS = 'GET, POST, OPTIONS';

export const ADMIN_AI_KB_REINDEX_PROBE = {
  path: ADMIN_AI_KB_REINDEX_PATH,
  methods: ['GET', 'POST', 'OPTIONS'] as const,
  authRequired: true,
  minRole: 'admin' as const,
  rateLimitKey: 'admin-ai-kb-reindex',
  unauthenticatedStatus: 401,
};

export function normalizeEmbeddingProvider(raw: unknown): EmbeddingProvider | null {
  if (raw === 'hash' || raw === 'openai') return raw;
  return null;
}

export function parseReindexProviderBody(body: unknown): EmbeddingProvider | null {
  if (typeof body !== 'object' || body === null || !('provider' in body)) return null;
  return normalizeEmbeddingProvider((body as { provider?: unknown }).provider);
}

export function safeKbText(s: string, max = 6000): string {
  const trimmed = s.trim();
  return trimmed.length <= max ? trimmed : trimmed.slice(0, max);
}