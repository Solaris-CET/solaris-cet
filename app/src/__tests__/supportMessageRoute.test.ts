// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  isValidSupportMessage,
  parseSupportMessageBody,
  SUPPORT_MESSAGE_PATH,
  SUPPORT_MESSAGE_PROBE,
} from '../../api/lib/supportMessage';

const messageMocks = vi.hoisted(() => ({
  authOk: true,
  convFound: true,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/authUser', () => ({
  requireUser: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!messageMocks.authOk || !auth.startsWith('Bearer valid-token')) return null;
    return { id: 'user-1', walletAddress: 'EQabc', role: 'user' };
  },
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from() {
          return {
            where() {
              return {
                limit: async () => (messageMocks.convFound ? [{ id: 'conv-1', userId: 'user-1' }] : []),
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
            returning: async () => [{ id: 'msg-1' }],
          };
        },
      };
    },
    update() {
      return {
        set() {
          return {
            where: async () => undefined,
          };
        },
      };
    },
  }),
  schema: {
    crmConversations: { id: 'crmConversations.id', userId: 'crmConversations.userId' },
    crmMessages: { conversationId: 'crmMessages.conversationId' },
  },
}));

import supportMessageRoute, { SUPPORT_MESSAGE_PROBE as routeProbe } from '../../api/support/message/route';

function messageRequest(body: unknown, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('Authorization', 'Bearer valid-token');
  headers.set('Content-Type', 'application/json');
  return new Request(`http://test${SUPPORT_MESSAGE_PATH}`, {
    method: 'POST',
    ...init,
    headers,
    body: JSON.stringify(body),
  });
}

describe('supportMessage helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SUPPORT_MESSAGE_PROBE.path).toBe('/api/support/message');
    expect(routeProbe.maxMessageLength).toBe(2000);
    expect(routeProbe.authRequired).toBe(true);
  });

  it('parseSupportMessageBody trims fields', () => {
    expect(parseSupportMessageBody({ conversationId: ' conv-1 ', message: ' hello ' })).toEqual({
      conversationId: 'conv-1',
      message: 'hello',
    });
    expect(parseSupportMessageBody({ conversationId: '   ', message: 'hello' })?.conversationId).toBe('');
  });

  it('isValidSupportMessage enforces length', () => {
    expect(isValidSupportMessage('hello')).toBe(true);
    expect(isValidSupportMessage('')).toBe(false);
    expect(isValidSupportMessage('x'.repeat(2001))).toBe(false);
  });
});

describe('/api/support/message e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    messageMocks.authOk = true;
    messageMocks.convFound = true;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SUPPORT_MESSAGE_PATH);
    expect(src).toContain('api/support/message/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await supportMessageRoute(
      new Request(`http://test${SUPPORT_MESSAGE_PATH}`, { method: 'OPTIONS', headers: { origin: 'https://allowed.test' } }),
    );
    expect(res.status).toBe(204);
  });

  it('POST creates message for owned conversation', async () => {
    const res = await supportMessageRoute(
      messageRequest({ conversationId: 'conv-1', message: 'Am nevoie de ajutor cu oferta.' }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; message: { id: string } };
    expect(body.ok).toBe(true);
    expect(body.message.id).toBe('msg-1');
  });

  it('POST without auth returns 401', async () => {
    messageMocks.authOk = false;
    const res = await supportMessageRoute(
      messageRequest({ conversationId: 'conv-1', message: 'test' }),
    );
    expect(res.status).toBe(401);
  });

  it('POST missing conversationId returns 400', async () => {
    const res = await supportMessageRoute(messageRequest({ message: 'test' }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SUPPORT_MESSAGE_PROBE.missingConversationIdError);
  });

  it('POST unknown conversation returns 404', async () => {
    messageMocks.convFound = false;
    const res = await supportMessageRoute(
      messageRequest({ conversationId: 'conv-missing', message: 'test' }),
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SUPPORT_MESSAGE_PROBE.notFoundError);
  });
});