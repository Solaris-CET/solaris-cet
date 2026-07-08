// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_CONVERSATION_RESOLVE_PATH,
  ADMIN_CONVERSATION_RESOLVE_PROBE,
  parseConversationResolveBody,
} from '../../api/lib/adminConversationResolve';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'editor' as 'admin' | 'editor' | 'viewer',
  updateCalls: 0,
  lastUpdate: null as { status: string; resolvedAt: Date; updatedAt: Date } | null,
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
    update() {
      adminMocks.updateCalls += 1;
      return {
        set(values: Record<string, unknown>) {
          adminMocks.lastUpdate = {
            status: String(values.status),
            resolvedAt: values.resolvedAt as Date,
            updatedAt: values.updatedAt as Date,
          };
          return { where: async () => undefined };
        },
      };
    },
  }),
  schema: {
    crmConversations: { id: 'crmConversations.id', status: 'crmConversations.status' },
  },
}));

import adminConversationResolveRoute, {
  ADMIN_CONVERSATION_RESOLVE_PROBE as routeProbe,
} from '../../api/admin/conversation/resolve/route';
import { writeAdminAudit } from '../../api/lib/adminAudit';

describe('adminConversationResolve helpers', () => {
  it('parseConversationResolveBody requires conversationId', () => {
    expect(parseConversationResolveBody({ conversationId: 'conv-1' })).toEqual({
      ok: true,
      conversationId: 'conv-1',
    });
    expect(parseConversationResolveBody({ conversationId: '  ' })).toEqual({
      ok: false,
      error: 'Missing conversationId',
    });
  });

  it('exports stable e2e probe contract', () => {
    expect(ADMIN_CONVERSATION_RESOLVE_PROBE.path).toBe('/api/admin/conversation/resolve');
    expect(routeProbe.minRole).toBe('editor');
    expect(routeProbe.rateLimitKey).toBe('admin-crm-resolve');
    expect(routeProbe.resolvedStatus).toBe('resolved');
    expect(routeProbe.methods).toEqual(['POST', 'OPTIONS']);
  });
});

describe('/api/admin/conversation/resolve e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.role = 'editor';
    adminMocks.updateCalls = 0;
    adminMocks.lastUpdate = null;
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_CONVERSATION_RESOLVE_PATH);
    expect(src).toContain('api/admin/conversation/resolve/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminConversationResolveRoute(
      new Request(`http://test${ADMIN_CONVERSATION_RESOLVE_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
  });

  it('rejects unknown origins', async () => {
    const res = await adminConversationResolveRoute(
      new Request(`http://test${ADMIN_CONVERSATION_RESOLVE_PATH}`, {
        method: 'POST',
        headers: { Authorization: 'Bearer admin-token', origin: 'https://evil.test' },
      }),
    );
    expect(res.status).toBe(403);
  });

  it('POST requires admin auth', async () => {
    adminMocks.authOk = false;
    const res = await adminConversationResolveRoute(
      adminRequest(ADMIN_CONVERSATION_RESOLVE_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: 'conv-1' }),
      }),
    );
    expect(res.status).toBe(ADMIN_CONVERSATION_RESOLVE_PROBE.unauthenticatedStatus);
  });

  it('POST requires editor role', async () => {
    adminMocks.role = 'viewer';
    const res = await adminConversationResolveRoute(
      adminRequest(ADMIN_CONVERSATION_RESOLVE_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: 'conv-1' }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it('POST resolves conversation and writes audit', async () => {
    const res = await adminConversationResolveRoute(
      adminRequest(ADMIN_CONVERSATION_RESOLVE_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: 'conv-1' }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    expect(adminMocks.updateCalls).toBe(1);
    expect(adminMocks.lastUpdate?.status).toBe('resolved');
    expect(writeAdminAudit).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({ admin: expect.objectContaining({ id: 'admin_1' }) }),
      'CRM_CONVERSATION_RESOLVED',
      'crm_conversation',
      'conv-1',
      {},
    );
  });

  it('POST returns 400 when conversationId is missing', async () => {
    const res = await adminConversationResolveRoute(
      adminRequest(ADMIN_CONVERSATION_RESOLVE_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('GET returns 405', async () => {
    const res = await adminConversationResolveRoute(adminRequest(ADMIN_CONVERSATION_RESOLVE_PATH, { method: 'GET' }));
    expect(res.status).toBe(405);
  });
});