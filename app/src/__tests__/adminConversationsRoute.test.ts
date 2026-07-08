// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_CONVERSATIONS_PATH,
  ADMIN_CONVERSATIONS_PROBE,
  parseConversationsStatusFilter,
} from '../../api/lib/adminConversations';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'viewer' as 'admin' | 'viewer',
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
import adminConversationsRoute, { ADMIN_CONVERSATIONS_PROBE as routeProbe } from '../../api/admin/conversations/route';

describe('adminConversations helpers', () => {
  it('parseConversationsStatusFilter maps status param', () => {
    expect(parseConversationsStatusFilter(new URLSearchParams('status=open'))).toEqual(['open']);
    expect(parseConversationsStatusFilter(new URLSearchParams())).toEqual(['open', 'resolved']);
  });

  it('exports stable e2e probe contract', () => {
    expect(ADMIN_CONVERSATIONS_PROBE.path).toBe('/api/admin/conversations');
    expect(routeProbe.minRole).toBe('viewer');
    expect(routeProbe.methods).toEqual(['GET', 'OPTIONS']);
  });
});

describe('/api/admin/conversations e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.role = 'viewer';
    adminMocks.queryStep = 0;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_CONVERSATIONS_PATH);
    expect(src).toContain('api/admin/conversations/route.js');
  });

  it('GET requires admin auth', async () => {
    adminMocks.authOk = false;
    const res = await adminConversationsRoute(adminRequest(ADMIN_CONVERSATIONS_PATH, { method: 'GET' }));
    expect(res.status).toBe(ADMIN_CONVERSATIONS_PROBE.unauthenticatedStatus);
  });

  it('GET returns conversations with contact and wallet', async () => {
    const res = await adminConversationsRoute(adminRequest(`${ADMIN_CONVERSATIONS_PATH}?status=open`, { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      conversations: Array<{ id: string; email: string | null; walletAddress: string | null }>;
    };
    expect(body.ok).toBe(true);
    expect(body.conversations[0]?.id).toBe('conv-1');
    expect(body.conversations[0]?.email).toBe('a@test.com');
    expect(body.conversations[0]?.walletAddress).toBe('EQ_USER');
  });

  it('POST returns 405', async () => {
    const res = await adminConversationsRoute(adminRequest(ADMIN_CONVERSATIONS_PATH, { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});