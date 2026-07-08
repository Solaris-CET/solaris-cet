// @vitest-environment node
import { authRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AI_PINS_PATH, AI_PINS_PROBE, parsePinDeleteId, parsePinPostBody } from '../../api/lib/aiPins';

const pinsMocks = vi.hoisted(() => ({
  authOk: true,
  pins: [
    {
      pinId: 'pin-1',
      note: 'Important',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      messageId: 'msg-1234567890',
      content: 'Pinned answer',
      conversationId: 'conv-1',
    },
  ],
  message: { id: 'msg-1234567890', conversationId: 'conv-1' },
  conversation: { id: 'conv-1' },
  insertedPinId: 'pin-new',
  deleted: false,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!pinsMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return { user: { id: 'user-1', role: 'user' }, sid: null, mfaEnabled: false };
  },
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select(arg?: unknown) {
      const isPinList = arg && typeof arg === 'object' && 'pinId' in arg;
      if (isPinList) {
        return {
          from() {
            return {
              innerJoin() {
                return {
                  where() {
                    return {
                      orderBy() {
                        return {
                          limit: async () => pinsMocks.pins,
                        };
                      },
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
            where: async () => {
              if (arg && typeof arg === 'object' && 'conversationId' in arg) {
                return pinsMocks.conversation ? [pinsMocks.conversation] : [];
              }
              return pinsMocks.message ? [pinsMocks.message] : [];
            },
          };
        },
      };
    },
    insert() {
      return {
        values() {
          return {
            returning: async () => [{ id: pinsMocks.insertedPinId }],
          };
        },
      };
    },
    delete() {
      return {
        where: async () => {
          pinsMocks.deleted = true;
        },
      };
    },
  }),
  schema: {
    aiPins: { id: 'aiPins.id', userId: 'aiPins.userId', messageId: 'aiPins.messageId', note: 'aiPins.note', createdAt: 'aiPins.createdAt' },
    aiMessages: { id: 'aiMessages.id', conversationId: 'aiMessages.conversationId', content: 'aiMessages.content' },
    aiConversations: { id: 'aiConversations.id', userId: 'aiConversations.userId' },
  },
}));

import aiPinsRoute, { AI_PINS_PROBE as routeProbe } from '../../api/ai/pins/route';

describe('aiPins helpers', () => {
  it('parsePinPostBody validates messageId', () => {
    expect(parsePinPostBody({ messageId: 'msg-1', note: ' note ' })).toEqual({
      ok: true,
      messageId: 'msg-1',
      note: 'note',
    });
    expect(parsePinPostBody({})).toEqual({ ok: false, error: AI_PINS_PROBE.missingMessageIdError });
  });

  it('parsePinDeleteId trims id', () => {
    expect(parsePinDeleteId(new URLSearchParams('id= pin-9 '))).toBe('pin-9');
  });

  it('exports stable e2e probe contract', () => {
    expect(AI_PINS_PROBE.path).toBe('/api/ai/pins');
    expect(routeProbe.authRequired).toBe(true);
    expect(routeProbe.methods).toEqual(['GET', 'POST', 'DELETE', 'OPTIONS']);
  });
});

describe('/api/ai/pins e2e probe', () => {
  beforeEach(() => {
    pinsMocks.authOk = true;
    pinsMocks.deleted = false;
    pinsMocks.message = { id: 'msg-1234567890', conversationId: 'conv-1' };
    pinsMocks.conversation = { id: 'conv-1' };
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(AI_PINS_PATH);
    expect(src).toContain('api/ai/pins/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await aiPinsRoute(authRequest(AI_PINS_PATH, { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('DELETE');
  });

  it('GET requires auth', async () => {
    pinsMocks.authOk = false;
    const res = await aiPinsRoute(authRequest(AI_PINS_PATH, { method: 'GET' }));
    expect(res.status).toBe(401);
  });

  it('GET returns pins', async () => {
    const res = await aiPinsRoute(authRequest(AI_PINS_PATH, { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { pins: Array<{ pinId: string; content: string }> };
    expect(body.pins[0]?.pinId).toBe('pin-1');
    expect(body.pins[0]?.content).toBe('Pinned answer');
  });

  it('POST creates pin', async () => {
    const res = await aiPinsRoute(
      authRequest(AI_PINS_PATH, {
        method: 'POST',
        body: JSON.stringify({ messageId: 'msg-1234567890', note: 'Save' }),
      }),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { pinId: string };
    expect(body.pinId).toBe('pin-new');
  });

  it('DELETE removes pin', async () => {
    const res = await aiPinsRoute(authRequest(`${AI_PINS_PATH}?id=pin-1`, { method: 'DELETE' }));
    expect(res.status).toBe(204);
    expect(pinsMocks.deleted).toBe(true);
  });

  it('DELETE requires id', async () => {
    const res = await aiPinsRoute(authRequest(AI_PINS_PATH, { method: 'DELETE' }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(AI_PINS_PROBE.missingIdError);
  });
});