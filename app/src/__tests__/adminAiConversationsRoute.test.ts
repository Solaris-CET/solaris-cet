// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_AI_CONVERSATIONS_PATH,
  ADMIN_AI_CONVERSATIONS_PROBE,
  parseDeleteConversationId,
} from '../../api/lib/adminAiConversations';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'admin' as 'admin' | 'viewer',
  deleted: false,
  conversation: {
    id: 'conv-1',
    userId: 'user-1',
    title: 'Solar quote',
    modelPreference: 'grok',
    createdAt: new Date('2026-03-01T10:00:00Z'),
    lastMessageAt: new Date('2026-03-01T11:00:00Z'),
    messages: 4,
    walletAddress: 'EQ_WALLET',
  },
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/adminAudit', () => ({
  writeAdminAudit: vi.fn(async () => undefined),
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
      const isList = arg && typeof arg === 'object' && 'messages' in arg;
      if (isList) {
        return {
          from() {
            return {
              leftJoin() {
                return {
                  leftJoin() {
                    return {
                      groupBy() {
                        return {
                          orderBy() {
                            return {
                              limit: async () => [adminMocks.conversation],
                            };
                          },
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
            where: async () => (adminMocks.deleted ? [] : [{ id: 'conv-1', userId: 'user-1' }]),
          };
        },
      };
    },
    delete() {
      return {
        where: async () => {
          adminMocks.deleted = true;
        },
      };
    },
  }),
  schema: {
    aiConversations: { id: 'aiConversations.id', userId: 'aiConversations.userId' },
    aiMessages: { id: 'aiMessages.id', conversationId: 'aiMessages.conversationId' },
    users: { id: 'users.id', walletAddress: 'users.walletAddress' },
  },
}));

import adminAiConversationsRoute, { ADMIN_AI_CONVERSATIONS_PROBE as routeProbe } from '../../api/admin/ai/conversations/route';
import { writeAdminAudit } from '../../api/lib/adminAudit';

describe('adminAiConversations helpers', () => {
  it('parseDeleteConversationId trims query param', () => {
    expect(parseDeleteConversationId(new URLSearchParams('id=conv-1'))).toBe('conv-1');
    expect(parseDeleteConversationId(new URLSearchParams(''))).toBeNull();
  });

  it('exports stable e2e probe contract', () => {
    expect(ADMIN_AI_CONVERSATIONS_PROBE.path).toBe('/api/admin/ai/conversations');
    expect(routeProbe.getMinRole).toBe('viewer');
    expect(routeProbe.deleteMinRole).toBe('admin');
    expect(routeProbe.methods).toEqual(['GET', 'DELETE', 'OPTIONS']);
  });
});

describe('/api/admin/ai/conversations e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.role = 'admin';
    adminMocks.deleted = false;
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_AI_CONVERSATIONS_PATH);
    expect(src).toContain('api/admin/ai/conversations/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminAiConversationsRoute(
      new Request(`http://test${ADMIN_AI_CONVERSATIONS_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('DELETE');
  });

  it('GET requires admin auth', async () => {
    adminMocks.authOk = false;
    const res = await adminAiConversationsRoute(adminRequest(ADMIN_AI_CONVERSATIONS_PATH, { method: 'GET' }));
    expect(res.status).toBe(ADMIN_AI_CONVERSATIONS_PROBE.unauthenticatedStatus);
  });

  it('GET lists conversations for viewer role', async () => {
    adminMocks.role = 'viewer';
    const res = await adminAiConversationsRoute(adminRequest(ADMIN_AI_CONVERSATIONS_PATH, { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { conversations: Array<{ id: string; messages: number }> };
    expect(body.conversations[0]?.id).toBe('conv-1');
    expect(body.conversations[0]?.messages).toBe(4);
  });

  it('DELETE requires admin role', async () => {
    adminMocks.role = 'viewer';
    const res = await adminAiConversationsRoute(
      adminRequest(`${ADMIN_AI_CONVERSATIONS_PATH}?id=conv-1`, { method: 'DELETE' }),
    );
    expect(res.status).toBe(403);
  });

  it('DELETE rejects missing id', async () => {
    const res = await adminAiConversationsRoute(adminRequest(ADMIN_AI_CONVERSATIONS_PATH, { method: 'DELETE' }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Missing id');
  });

  it('DELETE removes conversation and writes audit log', async () => {
    const res = await adminAiConversationsRoute(
      adminRequest(`${ADMIN_AI_CONVERSATIONS_PATH}?id=conv-1`, { method: 'DELETE' }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    expect(adminMocks.deleted).toBe(true);
    expect(writeAdminAudit).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({ admin: expect.objectContaining({ role: 'admin' }) }),
      'AI_CONVERSATION_DELETED',
      'ai_conversation',
      'conv-1',
      { userId: 'user-1' },
    );
  });

  it('DELETE returns 404 when conversation is missing', async () => {
    adminMocks.deleted = true;
    const res = await adminAiConversationsRoute(
      adminRequest(`${ADMIN_AI_CONVERSATIONS_PATH}?id=missing`, { method: 'DELETE' }),
    );
    expect(res.status).toBe(404);
  });

  it('POST returns 405', async () => {
    const res = await adminAiConversationsRoute(adminRequest(ADMIN_AI_CONVERSATIONS_PATH, { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});