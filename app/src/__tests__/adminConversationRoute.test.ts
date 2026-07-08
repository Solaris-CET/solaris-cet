// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_CONVERSATION_PATH,
  ADMIN_CONVERSATION_PROBE,
  parseAdminConversationId,
} from '../../api/lib/adminConversation';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'viewer' as 'admin' | 'viewer',
  conversation: {
    id: 'conv-1',
    status: 'open',
    createdAt: new Date('2026-03-01T10:00:00Z'),
    updatedAt: new Date('2026-03-01T11:00:00Z'),
  } as {
    id: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  } | null,
  messages: [
    {
      id: 'msg-1',
      sender: 'user',
      body: 'Buna ziua',
      createdAt: new Date('2026-03-01T10:05:00Z'),
      conversationId: 'conv-1',
    },
  ],
  queryStep: 0,
}));

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
    select() {
      return {
        from() {
          return {
            where() {
              return {
                limit: async () => (adminMocks.conversation ? [adminMocks.conversation] : []),
                orderBy() {
                  return Promise.resolve(adminMocks.messages);
                },
              };
            },
          };
        },
      };
    },
  }),
  schema: {
    crmConversations: { id: 'crmConversations.id' },
    crmMessages: {
      id: 'crmMessages.id',
      sender: 'crmMessages.sender',
      body: 'crmMessages.body',
      conversationId: 'crmMessages.conversationId',
    },
  },
}));

import adminConversationRoute, { ADMIN_CONVERSATION_PROBE as routeProbe } from '../../api/admin/conversation/route';

describe('adminConversation helpers', () => {
  it('parseAdminConversationId trims id query param', () => {
    expect(parseAdminConversationId(new URLSearchParams('id=conv-1'))).toBe('conv-1');
    expect(parseAdminConversationId(new URLSearchParams('id=  '))).toBe('');
  });

  it('exports stable e2e probe contract', () => {
    expect(ADMIN_CONVERSATION_PROBE.path).toBe('/api/admin/conversation');
    expect(routeProbe.minRole).toBe('viewer');
    expect(routeProbe.methods).toEqual(['GET', 'OPTIONS']);
  });
});

describe('/api/admin/conversation e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.role = 'viewer';
    adminMocks.queryStep = 0;
    adminMocks.conversation = {
      id: 'conv-1',
      status: 'open',
      createdAt: new Date('2026-03-01T10:00:00Z'),
      updatedAt: new Date('2026-03-01T11:00:00Z'),
    };
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_CONVERSATION_PATH);
    expect(src).toContain('api/admin/conversation/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminConversationRoute(
      new Request(`http://test${ADMIN_CONVERSATION_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('rejects unknown origins', async () => {
    const res = await adminConversationRoute(
      new Request(`http://test${ADMIN_CONVERSATION_PATH}?id=conv-1`, {
        method: 'GET',
        headers: { Authorization: 'Bearer admin-token', origin: 'https://evil.test' },
      }),
    );
    expect(res.status).toBe(403);
  });

  it('GET requires admin auth', async () => {
    adminMocks.authOk = false;
    const res = await adminConversationRoute(adminRequest(`${ADMIN_CONVERSATION_PATH}?id=conv-1`, { method: 'GET' }));
    expect(res.status).toBe(ADMIN_CONVERSATION_PROBE.unauthenticatedStatus);
  });

  it('GET returns 400 when id is missing', async () => {
    const res = await adminConversationRoute(adminRequest(ADMIN_CONVERSATION_PATH, { method: 'GET' }));
    expect(res.status).toBe(400);
  });

  it('GET returns 404 when conversation is not found', async () => {
    adminMocks.conversation = null;
    const res = await adminConversationRoute(adminRequest(`${ADMIN_CONVERSATION_PATH}?id=missing`, { method: 'GET' }));
    expect(res.status).toBe(404);
  });

  it('GET returns conversation with messages', async () => {
    const res = await adminConversationRoute(adminRequest(`${ADMIN_CONVERSATION_PATH}?id=conv-1`, { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      conversation: { id: string; status: string };
      messages: Array<{ sender: string; body: string }>;
    };
    expect(body.ok).toBe(true);
    expect(body.conversation.id).toBe('conv-1');
    expect(body.messages[0]?.sender).toBe('user');
    expect(body.messages[0]?.body).toBe('Buna ziua');
  });

  it('POST returns 405', async () => {
    const res = await adminConversationRoute(adminRequest(`${ADMIN_CONVERSATION_PATH}?id=conv-1`, { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});