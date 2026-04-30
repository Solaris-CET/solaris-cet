import path from 'node:path';

import { and, desc, eq, isNull, sql } from 'drizzle-orm';

import { getDb, schema } from '../../../../../db/client';
import { writeAdminAudit } from '../../../../lib/adminAudit';
import { requireAdminAuth, requireAdminRole } from '../../../../lib/adminAuth';
import { getAllowedOrigin } from '../../../../lib/cors';
import { configuredEmbeddingProvider, type EmbeddingProvider } from '../../../../lib/embeddings';
import { corsJson, corsOptions, readJson } from '../../../../lib/http';
import { buildKbChunks, collectKbSourceFiles } from '../../../../lib/kbIndex';
import { withRateLimit } from '../../../../lib/rateLimit';
import { redisSetJson } from '../../../../lib/upstashRedis';

export const config = { runtime: 'nodejs' };

function repoRootDir(): string {
  const override = (process.env.CET_AI_KB_ROOT_DIR ?? '').trim();
  if (override) return path.resolve(override);
  const cwd = process.cwd();
  if (path.basename(cwd) === 'app') return path.resolve(cwd, '..');
  return cwd;
}

function normalizeProvider(raw: unknown): EmbeddingProvider | null {
  if (raw === 'hash' || raw === 'openai') return raw;
  return null;
}

function safeTrim(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : t.slice(0, max);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, POST, OPTIONS');

  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (origin && allowedOrigin !== origin) return corsJson(req, 403, { error: 'Forbidden' });

  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: 'admin-ai-kb-reindex',
    limit: 10,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const ok = requireAdminRole(ctx, 'admin');
  if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });

  const db = getDb();

  if (req.method === 'GET') {
    const [total] = await db
      .select({ c: sql<number>`count(*)`.as('c') })
      .from(schema.aiVectorDocs)
      .where(and(eq(schema.aiVectorDocs.kind, 'kb'), isNull(schema.aiVectorDocs.userId)));
    const latest = await db
      .select({ createdAt: schema.aiVectorDocs.createdAt })
      .from(schema.aiVectorDocs)
      .where(and(eq(schema.aiVectorDocs.kind, 'kb'), isNull(schema.aiVectorDocs.userId)))
      .orderBy(desc(schema.aiVectorDocs.createdAt))
      .limit(1);
    return corsJson(req, 200, { kbDocsTotal: total?.c ?? 0, kbLastIndexedAt: latest?.[0]?.createdAt ?? null });
  }

  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const body = await readJson(req).catch(() => null);
  const providerBody =
    typeof body === 'object' && body !== null && 'provider' in body ? normalizeProvider((body as { provider?: unknown }).provider) : null;
  const provider = providerBody ?? configuredEmbeddingProvider();

  const rootDir = repoRootDir();
  const sources = await collectKbSourceFiles(rootDir);
  const maxSources = Math.max(10, Math.min(500, Number(process.env.CET_AI_KB_MAX_SOURCES ?? '250') || 250));
  const picked = sources.slice(0, maxSources);

  const chunks = await buildKbChunks(picked, { embeddingProvider: provider });
  const maxChunks = Math.max(100, Math.min(6000, Number(process.env.CET_AI_KB_MAX_CHUNKS ?? '2500') || 2500));
  const pickedChunks = chunks.slice(0, maxChunks);

  await db
    .delete(schema.aiVectorDocs)
    .where(and(eq(schema.aiVectorDocs.kind, 'kb'), isNull(schema.aiVectorDocs.userId)));

  const batchSize = 200;
  for (let i = 0; i < pickedChunks.length; i += batchSize) {
    const batch = pickedChunks.slice(i, i + batchSize);
    await db.insert(schema.aiVectorDocs).values(
      batch.map((c) => ({
        userId: null,
        kind: 'kb',
        text: safeTrim(c.text, 6000),
        embedding: c.embedding.vector as unknown as object,
        meta: {
          idHash: c.idHash,
          relPath: c.relPath,
          title: c.title,
          chunkIndex: c.chunkIndex,
          provider: c.embedding.provider,
          model: c.embedding.model,
        },
      })),
    );
  }

  const version = { at: new Date().toISOString(), provider };
  void redisSetJson('cet-ai:kb:version', version, 60 * 60 * 24 * 365);

  await writeAdminAudit(req, ctx, 'AI_KB_REINDEX', 'ai_vector_docs', null, {
    provider,
    rootDir,
    sources: picked.length,
    chunks: pickedChunks.length,
  });

  return corsJson(req, 200, { ok: true, provider, sources: picked.length, chunks: pickedChunks.length, version });
}

