// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_AI_KB_REINDEX_PATH,
  ADMIN_AI_KB_REINDEX_PROBE,
  normalizeEmbeddingProvider,
  parseReindexProviderBody,
  safeKbText,
} from '../../api/lib/adminAiKbReindex';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'admin' as 'admin' | 'viewer',
  inserted: 0,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: (origin: string | null) => (origin === 'https://evil.test' ? 'https://allowed.test' : origin ?? 'https://allowed.test'),
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
}));

vi.mock('../../api/lib/adminAudit', () => ({
  writeAdminAudit: vi.fn(async () => undefined),
}));

vi.mock('../../api/lib/upstashRedis', () => ({
  redisSetJson: vi.fn(async () => true),
}));

vi.mock('../../api/lib/embeddings', () => ({
  configuredEmbeddingProvider: () => 'hash',
}));

vi.mock('../../api/lib/kbIndex', () => ({
  collectKbSourceFiles: async () => [{ relPath: 'docs/a.md', absPath: '/docs/a.md', title: 'Doc A' }],
  buildKbChunks: async () => [
    {
      idHash: 'hash-1',
      relPath: 'docs/a.md',
      title: 'Doc A',
      chunkIndex: 0,
      text: 'Solar knowledge chunk',
      embedding: { vector: [0.1, 0.2], provider: 'hash', model: 'hash-v1' },
    },
  ],
}));

vi.mock('../../api/lib/adminAuth', () => ({
  guardAdminRoute: async (req: Request, probe: {
    minRole: string | ((method: string) => string);
    unauthenticatedStatus?: number;
    unauthorizedError?: string;
    forbiddenStatus?: number;
    forbiddenError?: string;
  }) => {
    if (!adminMocks.authOk) {
      return {
        status: probe.unauthenticatedStatus ?? 401,
        error: probe.unauthorizedError ?? 'Unauthorized',
      };
    }
    const minRole = typeof probe.minRole === 'function' ? probe.minRole(req.method) : probe.minRole;
    const ranks: Record<string, number> = { viewer: 1, editor: 2, admin: 3 };
    if ((ranks[adminMocks.role] ?? 1) < (ranks[minRole] ?? 3)) {
      return {
        status: probe.forbiddenStatus ?? 403,
        error: probe.forbiddenError ?? 'Forbidden',
      };
    }
    return { admin: { id: 'admin_1', role: adminMocks.role }, sessionId: 'sess_1' };
  },
}));
import adminAiKbReindexRoute, { ADMIN_AI_KB_REINDEX_PROBE as routeProbe } from '../../api/admin/ai/kb/reindex/route';
import { writeAdminAudit } from '../../api/lib/adminAudit';
import { redisSetJson } from '../../api/lib/upstashRedis';

describe('adminAiKbReindex helpers', () => {
  it('normalizeEmbeddingProvider accepts hash and openai', () => {
    expect(normalizeEmbeddingProvider('hash')).toBe('hash');
    expect(normalizeEmbeddingProvider('openai')).toBe('openai');
    expect(normalizeEmbeddingProvider('gemini')).toBeNull();
  });

  it('parseReindexProviderBody reads provider from JSON body', () => {
    expect(parseReindexProviderBody({ provider: 'openai' })).toBe('openai');
    expect(parseReindexProviderBody({})).toBeNull();
  });

  it('safeKbText trims and caps chunk size', () => {
    expect(safeKbText('  hello  ')).toBe('hello');
    expect(safeKbText('x'.repeat(7000), 6000).length).toBe(6000);
  });

  it('exports stable e2e probe contract', () => {
    expect(ADMIN_AI_KB_REINDEX_PROBE.path).toBe('/api/admin/ai/kb/reindex');
    expect(routeProbe.minRole).toBe('admin');
    expect(routeProbe.rateLimitKey).toBe('admin-ai-kb-reindex');
  });
});

describe('/api/admin/ai/kb/reindex e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.role = 'admin';
    adminMocks.inserted = 0;
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_AI_KB_REINDEX_PATH);
    expect(src).toContain('api/admin/ai/kb/reindex/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminAiKbReindexRoute(
      new Request(`http://test${ADMIN_AI_KB_REINDEX_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('rejects unknown origins', async () => {
    const res = await adminAiKbReindexRoute(
      new Request(`http://test${ADMIN_AI_KB_REINDEX_PATH}`, {
        method: 'GET',
        headers: { Authorization: 'Bearer admin-token', origin: 'https://evil.test' },
      }),
    );
    expect(res.status).toBe(403);
  });

  it('GET requires admin auth', async () => {
    adminMocks.authOk = false;
    const res = await adminAiKbReindexRoute(adminRequest(ADMIN_AI_KB_REINDEX_PATH, { method: 'GET' }));
    expect(res.status).toBe(ADMIN_AI_KB_REINDEX_PROBE.unauthenticatedStatus);
  });

  it('GET returns kb index stats for admin', async () => {
    const res = await adminAiKbReindexRoute(adminRequest(ADMIN_AI_KB_REINDEX_PATH, { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { kbDocsTotal: number; kbLastIndexedAt: string };
    expect(body.kbDocsTotal).toBe(12);
    expect(body.kbLastIndexedAt).toBeTruthy();
  });

  it('POST reindexes kb chunks and writes audit + redis version', async () => {
    const res = await adminAiKbReindexRoute(
      adminRequest(ADMIN_AI_KB_REINDEX_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'hash' }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; chunks: number; provider: string };
    expect(body.ok).toBe(true);
    expect(body.chunks).toBe(1);
    expect(body.provider).toBe('hash');
    expect(adminMocks.inserted).toBe(1);
    expect(redisSetJson).toHaveBeenCalled();
    expect(writeAdminAudit).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({ admin: expect.objectContaining({ role: 'admin' }) }),
      'AI_KB_REINDEX',
      'ai_vector_docs',
      null,
      expect.objectContaining({ chunks: 1 }),
    );
  });

  it('POST forbidden for viewer role', async () => {
    adminMocks.role = 'viewer';
    const res = await adminAiKbReindexRoute(adminRequest(ADMIN_AI_KB_REINDEX_PATH, { method: 'POST' }));
    expect(res.status).toBe(403);
  });

  it('DELETE returns 405', async () => {
    const res = await adminAiKbReindexRoute(adminRequest(ADMIN_AI_KB_REINDEX_PATH, { method: 'DELETE' }));
    expect(res.status).toBe(405);
  });
});