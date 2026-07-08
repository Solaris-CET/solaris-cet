// @vitest-environment node
import { authRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AI_HISTORY_PATH, AI_HISTORY_PROBE } from '../../api/lib/aiHistory';

const historyMocks = vi.hoisted(() => ({
  authOk: true,
  conversations: [
    {
      id: 'conv-1',
      title: 'CET basics',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      lastMessageAt: new Date('2026-01-02T00:00:00.000Z'),
      modelPreference: 'auto',
      tone: 'brand',
    },
  ],
  messages: [
    {
      id: 'msg-1',
      conversationId: 'conv-1',
      role: 'user',
      content: 'What is CET?',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      revisionOf: null,
    },
  ],
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!historyMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return { user: { id: 'user-1', role: 'user' }, sid: null, mfaEnabled: false };
  },
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select(arg?: unknown) {
      const isConversation = arg && typeof arg === 'object' && 'title' in arg;
      if (isConversation) {
        return {
          from() {
            return {
              where() {
                return {
                  orderBy() {
                    return {
                      limit: async () => historyMocks.conversations,
                    };
                  },
                };
              },
            };
          },
        };
      }
      return {
        from() {
          return {
            where() {
              return {
                orderBy: async () => historyMocks.messages,
              };
            },
          };
        },
      };
    },
  }),
  schema: {
    aiConversations: {
      id: 'aiConversations.id',
      userId: 'aiConversations.userId',
      title: 'aiConversations.title',
      createdAt: 'aiConversations.createdAt',
      updatedAt: 'aiConversations.updatedAt',
      lastMessageAt: 'aiConversations.lastMessageAt',
      modelPreference: 'aiConversations.modelPreference',
      tone: 'aiConversations.tone',
    },
    aiMessages: {
      id: 'aiMessages.id',
      conversationId: 'aiMessages.conversationId',
      role: 'aiMessages.role',
      content: 'aiMessages.content',
      createdAt: 'aiMessages.createdAt',
      revisionOf: 'aiMessages.revisionOf',
    },
  },
}));

import aiHistoryRoute, { AI_HISTORY_PROBE as routeProbe } from '../../api/ai/history/route';

describe('aiHistory helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(AI_HISTORY_PROBE.path).toBe('/api/ai/history');
    expect(routeProbe.authRequired).toBe(true);
    expect(routeProbe.maxConversations).toBe(50);
    expect(routeProbe.methods).toEqual(['GET', 'OPTIONS']);
  });
});

describe('/api/ai/history e2e probe', () => {
  beforeEach(() => {
    historyMocks.authOk = true;
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(AI_HISTORY_PATH);
    expect(src).toContain('api/ai/history/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await aiHistoryRoute(authRequest(AI_HISTORY_PATH, { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('GET requires auth', async () => {
    historyMocks.authOk = false;
    const res = await aiHistoryRoute(authRequest(AI_HISTORY_PATH, { method: 'GET' }));
    expect(res.status).toBe(401);
  });

  it('GET returns conversations with messages', async () => {
    const res = await aiHistoryRoute(authRequest(AI_HISTORY_PATH, { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      conversations: Array<{ id: string; messages: Array<{ id: string; content: string }> }>;
    };
    expect(body.conversations[0]?.id).toBe('conv-1');
    expect(body.conversations[0]?.messages[0]?.content).toBe('What is CET?');
  });

  it('POST returns 405', async () => {
    const res = await aiHistoryRoute(authRequest(AI_HISTORY_PATH, { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});