// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_CONVERSATION_REPLY_PATH,
  ADMIN_CONVERSATION_REPLY_PROBE,
  parseConversationReplyBody,
} from '../../api/lib/adminConversationReply';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'editor' as 'admin' | 'editor' | 'viewer',
  conversation: { id: 'conv-1', status: 'open' } as { id: string; status: string } | null,
  insertCalls: 0,
  updateCalls: 0,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: (origin: string | null) =>
    origin === 'https://evil.test' ? 'https://allowed.test' : (origin ?? 'https://allowed.test'),
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
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
    select() {
      return {
        from() {
          return {
            where() {
              return {
                limit: async () => (adminMocks.conversation ? [adminMocks.conversation] : []),
              };
            },
          };
        },
      };
    },
    insert() {
      adminMocks.insertCalls += 1;
      return { values: async () => undefined };
    },
    update() {
      adminMocks.updateCalls += 1;
      return { set: () => ({ where: async () => undefined }) };
    },
  }),
  schema: {
    crmConversations: { id: 'crmConversations.id' },
    crmMessages: { conversationId: 'crmMessages.conversationId' },
  },
}));

import adminConversationReplyRoute, {
  ADMIN_CONVERSATION_REPLY_PROBE as routeProbe,
} from '../../api/admin/conversation/reply/route';
import { writeAdminAudit } from '../../api/lib/adminAudit';

describe('adminConversationReply helpers', () => {
  it('parseConversationReplyBody validates ids and message length', () => {
    expect(parseConversationReplyBody({ conversationId: 'conv-1', message: 'Hello' })).toEqual({
      ok: true,
      conversationId: 'conv-1',
      message: 'Hello',
    });
    expect(parseConversationReplyBody({ conversationId: '', message: 'Hello' })).toEqual({
      ok: false,
      error: 'Missing conversationId',
    });
    expect(parseConversationReplyBody({ conversationId: 'conv-1', message: '' })).toEqual({
      ok: false,
      error: 'Invalid message',
    });
  });

  it('exports stable e2e probe contract', () => {
    expect(ADMIN_CONVERSATION_REPLY_PROBE.path).toBe('/api/admin/conversation/reply');
    expect(routeProbe.minRole).toBe('editor');
    expect(routeProbe.rateLimitKey).toBe('admin-crm-reply');
    expect(routeProbe.methods).toEqual(['POST', 'OPTIONS']);
  });
});

describe('/api/admin/conversation/reply e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.role = 'editor';
    adminMocks.conversation = { id: 'conv-1', status: 'open' };
    adminMocks.insertCalls = 0;
    adminMocks.updateCalls = 0;
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_CONVERSATION_REPLY_PATH);
    expect(src).toContain('api/admin/conversation/reply/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminConversationReplyRoute(
      new Request(`http://test${ADMIN_CONVERSATION_REPLY_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
  });

  it('rejects unknown origins', async () => {
    const res = await adminConversationReplyRoute(
      new Request(`http://test${ADMIN_CONVERSATION_REPLY_PATH}`, {
        method: 'POST',
        headers: { Authorization: 'Bearer admin-token', origin: 'https://evil.test' },
      }),
    );
    expect(res.status).toBe(403);
  });

  it('POST requires admin auth', async () => {
    adminMocks.authOk = false;
    const res = await adminConversationReplyRoute(
      adminRequest(ADMIN_CONVERSATION_REPLY_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: 'conv-1', message: 'Reply' }),
      }),
    );
    expect(res.status).toBe(ADMIN_CONVERSATION_REPLY_PROBE.unauthenticatedStatus);
  });

  it('POST requires editor role', async () => {
    adminMocks.role = 'viewer';
    const res = await adminConversationReplyRoute(
      adminRequest(ADMIN_CONVERSATION_REPLY_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: 'conv-1', message: 'Reply' }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it('POST replies to conversation and writes audit', async () => {
    const res = await adminConversationReplyRoute(
      adminRequest(ADMIN_CONVERSATION_REPLY_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: 'conv-1', message: 'Solaris reply' }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    expect(adminMocks.insertCalls).toBe(1);
    expect(adminMocks.updateCalls).toBe(1);
    expect(writeAdminAudit).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({ admin: expect.objectContaining({ id: 'admin_1' }) }),
      'CRM_CONVERSATION_REPLIED',
      'crm_conversation',
      'conv-1',
      { length: 'Solaris reply'.length },
    );
  });

  it('POST returns 404 when conversation is missing', async () => {
    adminMocks.conversation = null;
    const res = await adminConversationReplyRoute(
      adminRequest(ADMIN_CONVERSATION_REPLY_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: 'missing', message: 'Reply' }),
      }),
    );
    expect(res.status).toBe(404);
  });

  it('GET returns 405', async () => {
    const res = await adminConversationReplyRoute(adminRequest(ADMIN_CONVERSATION_REPLY_PATH, { method: 'GET' }));
    expect(res.status).toBe(405);
  });
});