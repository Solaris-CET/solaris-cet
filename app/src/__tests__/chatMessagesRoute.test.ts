// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CHAT_MESSAGES_PATH,
  CHAT_MESSAGES_PROBE,
  canModerateChat,
  chatMessageHasBannedWord,
  isValidChatMessagePost,
  parseChatMessagePostBody,
} from '../../api/lib/chatMessages';

const chatMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'user' as string,
  messages: [
    {
      id: 'msg-1',
      roomId: 'general',
      userId: 'user-1',
      body: 'Hello',
      status: 'visible',
      createdAt: new Date('2026-07-07T10:00:00Z'),
    },
    {
      id: 'msg-2',
      roomId: 'general',
      userId: 'user-2',
      body: 'scam offer',
      status: 'queued',
      createdAt: new Date('2026-07-07T10:01:00Z'),
    },
  ],
  inserted: { id: 'msg-new', status: 'visible', createdAt: new Date('2026-07-07T10:02:00Z') },
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!chatMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return {
      user: { id: 'user-1', walletAddress: 'EQabc', role: chatMocks.role },
      sid: 'sess-1',
      mfaEnabled: false,
    };
  },
}));

vi.mock('../../api/lib/points', () => ({
  awardPoints: async () => undefined,
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from() {
          return {
            where() {
              return {
                orderBy() {
                  return {
                    limit: async () => chatMocks.messages,
                  };
                },
              };
            },
          };
        },
      };
    },
    insert() {
      return {
        values() {
          return {
            returning: async () => [chatMocks.inserted],
          };
        },
      };
    },
  }),
  schema: {
    chatMessages: {
      roomId: 'chatMessages.roomId',
      createdAt: 'chatMessages.createdAt',
    },
  },
}));

import chatMessagesRoute, { CHAT_MESSAGES_PROBE as routeProbe } from '../../api/chat/messages/route';

function chatRequest(query = '', init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${CHAT_MESSAGES_PATH}${query}`, { ...init, headers });
}

describe('chatMessages helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(CHAT_MESSAGES_PROBE.path).toBe('/api/chat/messages');
    expect(routeProbe.maxMessageLength).toBe(500);
    expect(routeProbe.methods).toEqual(['GET', 'POST', 'OPTIONS']);
  });

  it('chatMessageHasBannedWord detects banned terms', () => {
    expect(chatMessageHasBannedWord('this is a scam', ['scam'])).toBe(true);
    expect(chatMessageHasBannedWord('hello world', ['scam'])).toBe(false);
  });

  it('parseChatMessagePostBody and isValidChatMessagePost', () => {
    const parsed = parseChatMessagePostBody({ roomId: ' general ', body: ' hi ' });
    expect(parsed).toEqual({ roomId: 'general', body: 'hi' });
    expect(isValidChatMessagePost(parsed)).toBe(true);
    expect(isValidChatMessagePost({ roomId: '', body: '' })).toBe(false);
  });

  it('canModerateChat checks moderator roles', () => {
    expect(canModerateChat('admin')).toBe(true);
    expect(canModerateChat('user')).toBe(false);
  });
});

describe('/api/chat/messages e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chatMocks.authOk = true;
    chatMocks.role = 'user';
    chatMocks.inserted = { id: 'msg-new', status: 'visible', createdAt: new Date('2026-07-07T10:02:00Z') };
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(CHAT_MESSAGES_PATH);
    expect(src).toContain('api/chat/messages/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await chatMessagesRoute(chatRequest('', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET without roomId returns 400', async () => {
    const res = await chatMessagesRoute(chatRequest('', { method: 'GET' }));
    expect(res.status).toBe(400);
  });

  it('GET returns visible messages for room', async () => {
    const res = await chatMessagesRoute(
      chatRequest('?roomId=general', { method: 'GET', headers: { Authorization: 'Bearer valid-token' } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { messages: Array<{ id: string }>; canModerate: boolean };
    expect(body.messages).toHaveLength(1);
    expect(body.canModerate).toBe(false);
  });

  it('GET as moderator includes queued messages', async () => {
    chatMocks.role = 'moderator';
    const res = await chatMessagesRoute(
      chatRequest('?roomId=general', { method: 'GET', headers: { Authorization: 'Bearer valid-token' } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { messages: unknown[]; canModerate: boolean };
    expect(body.messages).toHaveLength(2);
    expect(body.canModerate).toBe(true);
  });

  it('POST without auth returns 401', async () => {
    chatMocks.authOk = false;
    const res = await chatMessagesRoute(
      chatRequest('', {
        method: 'POST',
        body: JSON.stringify({ roomId: 'general', body: 'Hello' }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it('POST creates visible message', async () => {
    const res = await chatMessagesRoute(
      chatRequest('', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ roomId: 'general', body: 'Hello team' }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; message: { id: string } };
    expect(body.ok).toBe(true);
    expect(body.message.id).toBe('msg-new');
  });

  it('POST queues message with banned word', async () => {
    chatMocks.inserted = { id: 'msg-bad', status: 'queued', createdAt: new Date() };
    const res = await chatMessagesRoute(
      chatRequest('', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ roomId: 'general', body: 'free airdrop here' }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { message: { status: string } };
    expect(body.message.status).toBe('queued');
  });
});