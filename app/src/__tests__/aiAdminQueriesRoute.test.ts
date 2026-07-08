// @vitest-environment node
import { authRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AI_ADMIN_QUERIES_PATH,
  AI_ADMIN_QUERIES_PROBE,
  anonymizeAiAdminUserId,
} from '../../api/lib/aiAdminQueries';

const queriesMocks = vi.hoisted(() => ({
  authOk: true,
  isAdmin: true,
  queryRows: [
    {
      id: 'ql-1',
      userId: 'user-secret',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      query: 'What is CET token?',
      model: 'gpt-4',
      latencyMs: 1200,
      usedCache: false,
      moderationFlagged: false,
      qualityScore: 0.95,
    },
  ],
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/nodeCrypto', () => ({
  sha256Hex: (v: string) => `hash-${v}`,
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!queriesMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return {
      user: { id: 'admin-1', role: queriesMocks.isAdmin ? 'admin' : 'user' },
      sid: null,
      mfaEnabled: false,
    };
  },
  requireAdmin: (ctx: { user: { role: string } }) => {
    if (ctx.user.role === 'admin') return { ok: true as const };
    return { ok: false as const, error: 'Forbidden', status: 403 };
  },
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from() {
          return {
            orderBy() {
              return {
                limit: async () => queriesMocks.queryRows,
              };
            },
          };
        },
      };
    },
  }),
  schema: {
    aiQueryLogs: {
      id: 'aiQueryLogs.id',
      userId: 'aiQueryLogs.userId',
      createdAt: 'aiQueryLogs.createdAt',
      query: 'aiQueryLogs.query',
      model: 'aiQueryLogs.model',
      latencyMs: 'aiQueryLogs.latencyMs',
      usedCache: 'aiQueryLogs.usedCache',
      moderationFlagged: 'aiQueryLogs.moderationFlagged',
      qualityScore: 'aiQueryLogs.qualityScore',
    },
  },
}));

import aiAdminQueriesRoute, { AI_ADMIN_QUERIES_PROBE as routeProbe } from '../../api/ai/admin/queries/route';

describe('aiAdminQueries helpers', () => {
  it('anonymizeAiAdminUserId hashes or returns anon', () => {
    expect(anonymizeAiAdminUserId('user-1', (v) => `abcdef${v}`)).toHaveLength(AI_ADMIN_QUERIES_PROBE.userHashLength);
    expect(anonymizeAiAdminUserId(undefined, (v) => v)).toBe('anon');
  });

  it('exports stable e2e probe contract', () => {
    expect(AI_ADMIN_QUERIES_PROBE.path).toBe('/api/ai/admin/queries');
    expect(routeProbe.adminRequired).toBe(true);
    expect(routeProbe.maxListRows).toBe(500);
    expect(routeProbe.methods).toEqual(['GET', 'OPTIONS']);
  });
});

describe('/api/ai/admin/queries e2e probe', () => {
  beforeEach(() => {
    queriesMocks.authOk = true;
    queriesMocks.isAdmin = true;
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(AI_ADMIN_QUERIES_PATH);
    expect(src).toContain('api/ai/admin/queries/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await aiAdminQueriesRoute(
      new Request(`http://test${AI_ADMIN_QUERIES_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('GET requires auth', async () => {
    queriesMocks.authOk = false;
    const res = await aiAdminQueriesRoute(authRequest(AI_ADMIN_QUERIES_PATH, { method: 'GET' }));
    expect(res.status).toBe(401);
  });

  it('GET requires admin role', async () => {
    queriesMocks.isAdmin = false;
    const res = await aiAdminQueriesRoute(authRequest(AI_ADMIN_QUERIES_PATH, { method: 'GET' }));
    expect(res.status).toBe(403);
  });

  it('GET returns anonymized query logs', async () => {
    const res = await aiAdminQueriesRoute(authRequest(AI_ADMIN_QUERIES_PATH, { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      queries: Array<{ id: string; user: string; query: string; model: string }>;
    };
    expect(body.queries[0]?.id).toBe('ql-1');
    expect(body.queries[0]?.user).toBe('hash-user-secret'.slice(0, AI_ADMIN_QUERIES_PROBE.userHashLength));
    expect(body.queries[0]?.query).toBe('What is CET token?');
    expect(body.queries[0]?.model).toBe('gpt-4');
  });

  it('POST returns 405', async () => {
    const res = await aiAdminQueriesRoute(authRequest(AI_ADMIN_QUERIES_PATH, { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});