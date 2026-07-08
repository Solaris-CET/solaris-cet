// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { INVITES_CREATE_PATH, INVITES_CREATE_PROBE, parseInvitesCreateMaxUses } from '../../api/lib/invitesCreate';

const inviteMocks = vi.hoisted(() => ({
  authOk: true,
  inserted: null as Record<string, unknown> | null,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/authUser', () => ({
  requireUser: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!inviteMocks.authOk || !auth.startsWith('Bearer valid-token')) return null;
    return { id: 'user-1', walletAddress: 'EQabc', role: 'user' };
  },
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    insert() {
      return {
        values: async (row: Record<string, unknown>) => {
          inviteMocks.inserted = row;
        },
      };
    },
  }),
  schema: {
    userInvites: { tokenHash: 'userInvites.tokenHash' },
  },
}));

import invitesCreateRoute, { INVITES_CREATE_PROBE as routeProbe } from '../../api/gamification/invites/create/route';

function inviteRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${INVITES_CREATE_PATH}`, { ...init, headers });
}

describe('invitesCreate helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(INVITES_CREATE_PROBE.path).toBe('/api/gamification/invites/create');
    expect(routeProbe.authRequired).toBe(true);
    expect(routeProbe.maxMaxUses).toBe(20);
  });

  it('parseInvitesCreateMaxUses clamps range', () => {
    expect(parseInvitesCreateMaxUses({ maxUses: 50 })).toBe(20);
    expect(parseInvitesCreateMaxUses({ maxUses: 0 })).toBe(1);
    expect(parseInvitesCreateMaxUses({})).toBe(1);
  });
});

describe('/api/gamification/invites/create e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inviteMocks.authOk = true;
    inviteMocks.inserted = null;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(INVITES_CREATE_PATH);
    expect(src).toContain('api/gamification/invites/create/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await invitesCreateRoute(inviteRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('POST without auth returns 401', async () => {
    inviteMocks.authOk = false;
    const res = await invitesCreateRoute(inviteRequest({ method: 'POST', body: JSON.stringify({ maxUses: 3 }) }));
    expect(res.status).toBe(401);
  });

  it('POST creates invite token', async () => {
    const res = await invitesCreateRoute(
      inviteRequest({
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ maxUses: 5 }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; token: string; maxUses: number };
    expect(body.ok).toBe(true);
    expect(body.token.length).toBeGreaterThan(10);
    expect(body.maxUses).toBe(5);
    expect(inviteMocks.inserted?.maxUses).toBe(5);
    expect(inviteMocks.inserted?.createdByUserId).toBe('user-1');
  });
});