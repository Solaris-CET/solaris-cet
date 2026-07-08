// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_CHAT_ANALYTICS_PATH,
  ADMIN_CHAT_ANALYTICS_PROBE,
  chatAnalyticsOffset,
  parseChatAnalyticsLimit,
  parseChatAnalyticsPage,
  parseChatAnalyticsResolvedFilter,
  parseChatAnalyticsSessionId,
} from '../../api/lib/adminChatAnalytics';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'viewer' as 'admin' | 'viewer',
  queryStep: 0,
  countCall: 0,
  responses: [
    [{ id: 'sess-1', status: 'open', pageUrl: '/contact', createdAt: new Date('2026-03-01T10:00:00Z'), updatedAt: new Date('2026-03-01T11:00:00Z') }],
    [{ sender: 'user', body: 'Care este pretul?', createdAt: new Date('2026-03-01T10:05:00Z'), conversationId: 'sess-1' }],
    [{ count: 1 }],
    [{ id: 'conv-1', status: 'open', pageUrl: '/solar', createdAt: new Date('2026-03-01T09:00:00Z'), updatedAt: new Date('2026-03-01T12:00:00Z') }],
    [{ count: 0 }],
    [{ count: 1 }],
    [{ conversationId: 'conv-1', body: 'Vreau oferta pret', createdAt: new Date('2026-03-01T09:30:00Z'), sender: 'user' }],
    [{ id: 'conv-1', createdAt: new Date('2026-03-01T09:00:00Z') }],
    [{ conversationId: 'conv-1', body: 'pret si montaj', createdAt: new Date('2026-03-01T09:30:00Z') }],
  ] as unknown[][],
}));

function nextDbResult(): unknown[] {
  const row = adminMocks.responses[adminMocks.queryStep] ?? [];
  adminMocks.queryStep += 1;
  return row;
}

function terminalChain() {
  const result = nextDbResult();
  const chain = {
    orderBy() {
      return {
        limit() {
          return {
            offset: async () => result,
            then(onFulfilled: (rows: unknown[]) => void, onRejected?: (err: unknown) => void) {
              return Promise.resolve(result).then(onFulfilled, onRejected);
            },
          };
        },
        then(onFulfilled: (rows: unknown[]) => void, onRejected?: (err: unknown) => void) {
          return Promise.resolve(result).then(onFulfilled, onRejected);
        },
      };
    },
    limit() {
      return {
        then(onFulfilled: (rows: unknown[]) => void, onRejected?: (err: unknown) => void) {
          return Promise.resolve(result).then(onFulfilled, onRejected);
        },
      };
    },
    then(onFulfilled: (rows: unknown[]) => void, onRejected?: (err: unknown) => void) {
      return Promise.resolve(result).then(onFulfilled, onRejected);
    },
  };
  return chain;
}

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: (origin: string | null) =>
    origin === 'https://evil.test' ? 'https://allowed.test' : (origin ?? 'https://allowed.test'),
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

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select(arg?: unknown) {
      const isCount = arg && typeof arg === 'object' && 'count' in arg;
      const isRecentConv = arg && typeof arg === 'object' && 'id' in arg && 'createdAt' in arg;
      const isRecentMsg =
        arg && typeof arg === 'object' && 'conversationId' in arg && 'body' in arg && 'createdAt' in arg;
      const listMode = adminMocks.queryStep >= 2;

      if (isCount) {
        return {
          from() {
            const resolveCount = async () => {
              if (listMode) {
                const counts = [[{ count: 1 }], [{ count: 0 }], [{ count: 1 }]];
                return counts[adminMocks.countCall++ % counts.length] ?? [{ count: 0 }];
              }
              return nextDbResult();
            };
            return {
              where: resolveCount,
              then(onFulfilled: (rows: unknown[]) => void, onRejected?: (err: unknown) => void) {
                return resolveCount().then(onFulfilled, onRejected);
              },
            };
          },
        };
      }

      if (isRecentConv) {
        return {
          from() {
            return {
              where: async () => [{ id: 'conv-1', createdAt: new Date('2026-03-01T09:00:00Z') }],
            };
          },
        };
      }

      if (isRecentMsg) {
        return {
          from() {
            return {
              where: async () => [
                { conversationId: 'conv-1', body: 'Vreau oferta pret', createdAt: new Date('2026-03-01T09:30:00Z') },
              ],
            };
          },
        };
      }

      return {
        from() {
          return {
            where() {
              if (listMode) {
                const itemMessages = [
                  {
                    conversationId: 'conv-1',
                    body: 'Vreau oferta pret',
                    createdAt: new Date('2026-03-01T09:30:00Z'),
                    sender: 'user',
                  },
                ];
                return {
                  orderBy() {
                    return {
                      limit() {
                        return {
                          offset: async () => [
                            {
                              id: 'conv-1',
                              status: 'open',
                              pageUrl: '/solar',
                              createdAt: new Date('2026-03-01T09:00:00Z'),
                              updatedAt: new Date('2026-03-01T12:00:00Z'),
                            },
                          ],
                        };
                      },
                      then(onFulfilled: (rows: unknown[]) => void, onRejected?: (err: unknown) => void) {
                        return Promise.resolve(itemMessages).then(onFulfilled, onRejected);
                      },
                    };
                  },
                };
              }
              return {
                limit: async () => nextDbResult(),
                orderBy() {
                  return Promise.resolve(nextDbResult());
                },
              };
            },
            orderBy() {
              return Promise.resolve(
                listMode
                  ? [
                      {
                        conversationId: 'conv-1',
                        body: 'Vreau oferta pret',
                        createdAt: new Date('2026-03-01T09:30:00Z'),
                        sender: 'user',
                      },
                    ]
                  : nextDbResult(),
              );
            },
          };
        },
      };
    },
  }),
  schema: {
    crmConversations: {
      id: 'crmConversations.id',
      status: 'crmConversations.status',
      pageUrl: 'crmConversations.pageUrl',
      createdAt: 'crmConversations.createdAt',
      updatedAt: 'crmConversations.updatedAt',
    },
    crmMessages: {
      id: 'crmMessages.id',
      sender: 'crmMessages.sender',
      body: 'crmMessages.body',
      createdAt: 'crmMessages.createdAt',
      conversationId: 'crmMessages.conversationId',
    },
  },
}));

import adminChatAnalyticsRoute, { ADMIN_CHAT_ANALYTICS_PROBE as routeProbe } from '../../api/admin/chat-analytics/route';

describe('adminChatAnalytics helpers', () => {
  it('parseChatAnalyticsPage and limit clamp values', () => {
    expect(parseChatAnalyticsPage(new URLSearchParams('page=3'))).toBe(3);
    expect(parseChatAnalyticsPage(new URLSearchParams('page=0'))).toBe(1);
    expect(parseChatAnalyticsLimit(new URLSearchParams('limit=500'))).toBe(100);
    expect(chatAnalyticsOffset(2, 20)).toBe(20);
  });

  it('parseChatAnalyticsSessionId and resolved filter', () => {
    expect(parseChatAnalyticsSessionId(new URLSearchParams('session_id=sess-1'))).toBe('sess-1');
    expect(parseChatAnalyticsResolvedFilter(new URLSearchParams('resolved=true'))).toBe('true');
    expect(parseChatAnalyticsResolvedFilter(new URLSearchParams())).toBeNull();
  });

  it('exports stable e2e probe contract', () => {
    expect(ADMIN_CHAT_ANALYTICS_PROBE.path).toBe('/api/admin/chat-analytics');
    expect(routeProbe.minRole).toBe('viewer');
    expect(routeProbe.methods).toEqual(['GET', 'OPTIONS']);
  });
});

describe('/api/admin/chat-analytics e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.role = 'viewer';
    adminMocks.queryStep = 0;
    adminMocks.countCall = 0;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_CHAT_ANALYTICS_PATH);
    expect(src).toContain('api/admin/chat-analytics/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminChatAnalyticsRoute(
      new Request(`http://test${ADMIN_CHAT_ANALYTICS_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('rejects unknown origins', async () => {
    const res = await adminChatAnalyticsRoute(
      new Request(`http://test${ADMIN_CHAT_ANALYTICS_PATH}`, {
        method: 'GET',
        headers: { Authorization: 'Bearer admin-token', origin: 'https://evil.test' },
      }),
    );
    expect(res.status).toBe(403);
  });

  it('GET requires admin auth', async () => {
    adminMocks.authOk = false;
    const res = await adminChatAnalyticsRoute(adminRequest(ADMIN_CHAT_ANALYTICS_PATH, { method: 'GET' }));
    expect(res.status).toBe(ADMIN_CHAT_ANALYTICS_PROBE.unauthenticatedStatus);
  });

  it('GET returns session messages when session_id is set', async () => {
    const res = await adminChatAnalyticsRoute(
      adminRequest(`${ADMIN_CHAT_ANALYTICS_PATH}?session_id=sess-1`, { method: 'GET' }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { messages: Array<{ role: string; content: string }> };
    expect(body.messages[0]?.role).toBe('user');
    expect(body.messages[0]?.content).toContain('pretul');
  });

  it('GET returns conversation analytics list', async () => {
    adminMocks.queryStep = 2;
    const res = await adminChatAnalyticsRoute(
      adminRequest(`${ADMIN_CHAT_ANALYTICS_PATH}?page=1&limit=20`, { method: 'GET' }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      conversations: Array<{ id: string; messageCount: number }>;
      total: number;
      topTopics: Array<{ topic: string; count: number }>;
      resolutionRate: number;
    };
    expect(body.conversations[0]?.id).toBe('conv-1');
    expect(body.conversations[0]?.messageCount).toBe(1);
    expect(body.total).toBe(1);
    expect(body.topTopics.some((t) => t.topic === 'pret')).toBe(true);
    expect(body.resolutionRate).toBe(0);
  });

  it('POST returns 405', async () => {
    const res = await adminChatAnalyticsRoute(adminRequest(ADMIN_CHAT_ANALYTICS_PATH, { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});