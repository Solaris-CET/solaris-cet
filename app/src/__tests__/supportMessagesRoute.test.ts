// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildSupportMessagesPayload,
  mapSupportMessageItem,
  SUPPORT_MESSAGES_PATH,
  SUPPORT_MESSAGES_PROBE,
} from '../../api/lib/supportMessages';

const mocks = vi.hoisted(() => ({
  authOk: true,
  hasConversation: true,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/authUser', () => ({
  requireUser: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!mocks.authOk || !auth.startsWith('Bearer valid-token')) return null;
    return { id: 'user-1', walletAddress: 'EQabc', role: 'user' };
  },
}));

const sampleMessage = {
  id: 'msg-1',
  sender: 'user',
  body: 'Salut',
  createdAt: new Date('2026-07-07T10:00:00.000Z'),
};

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from() {
          return {
            where() {
              return {
                limit: async () => (mocks.hasConversation ? [{ id: 'conv-1', userId: 'user-1' }] : []),
                orderBy: () => ({
                  async then(resolve: (value: unknown[]) => void) {
                    resolve(mocks.hasConversation ? [sampleMessage] : []);
                  },
                }),
              };
            },
          };
        },
      };
    },
  }),
  schema: {
    crmConversations: { userId: 'crmConversations.userId' },
    crmMessages: { conversationId: 'crmMessages.conversationId', createdAt: 'crmMessages.createdAt' },
  },
}));

import supportMessagesRoute, { SUPPORT_MESSAGES_PROBE as routeProbe } from '../../api/support/messages/route';

function messagesRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('Authorization', 'Bearer valid-token');
  return new Request(`http://test${SUPPORT_MESSAGES_PATH}`, { ...init, headers });
}

describe('supportMessages helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SUPPORT_MESSAGES_PROBE.path).toBe('/api/support/messages');
    expect(routeProbe.authRequired).toBe(true);
  });

  it('mapSupportMessageItem serializes timestamps', () => {
    expect(mapSupportMessageItem(sampleMessage)).toEqual({
      id: 'msg-1',
      sender: 'user',
      body: 'Salut',
      createdAt: '2026-07-07T10:00:00.000Z',
    });
  });

  it('buildSupportMessagesPayload shapes empty and populated responses', () => {
    expect(buildSupportMessagesPayload(null, [])).toEqual({ ok: true, conversationId: null, messages: [] });
    expect(buildSupportMessagesPayload('conv-1', [sampleMessage]).conversationId).toBe('conv-1');
  });
});

describe('/api/support/messages e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authOk = true;
    mocks.hasConversation = true;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SUPPORT_MESSAGES_PATH);
    expect(src).toContain('api/support/messages/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await supportMessagesRoute(messagesRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET without auth returns 401', async () => {
    mocks.authOk = false;
    const res = await supportMessagesRoute(messagesRequest({ method: 'GET' }));
    expect(res.status).toBe(401);
  });

  it('GET returns messages for authenticated user', async () => {
    const res = await supportMessagesRoute(messagesRequest({ method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; conversationId: string | null; messages: unknown[] };
    expect(body.ok).toBe(true);
    expect(body.conversationId).toBe('conv-1');
    expect(body.messages).toHaveLength(1);
  });

  it('GET without conversation returns empty payload', async () => {
    mocks.hasConversation = false;
    const res = await supportMessagesRoute(messagesRequest({ method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { conversationId: string | null; messages: unknown[] };
    expect(body.conversationId).toBeNull();
    expect(body.messages).toEqual([]);
  });
});