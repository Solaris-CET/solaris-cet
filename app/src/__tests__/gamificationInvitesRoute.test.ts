// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GAMIFICATION_INVITES_PATH, GAMIFICATION_INVITES_PROBE } from '../../api/lib/gamificationInvites';

const invitesMocks = vi.hoisted(() => {
  const schema = {
    userInvites: {
      id: 'userInvites.id',
      usedCount: 'userInvites.usedCount',
      maxUses: 'userInvites.maxUses',
      expiresAt: 'userInvites.expiresAt',
      revokedAt: 'userInvites.revokedAt',
      createdAt: 'userInvites.createdAt',
      createdByUserId: 'userInvites.createdByUserId',
    },
  };

  const bag = {
    authOk: true,
    invites: [
      {
        id: 'inv-1',
        usedCount: 1,
        maxUses: 5,
        expiresAt: new Date('2026-08-01T00:00:00Z'),
        revokedAt: null,
        createdAt: new Date('2026-07-01T10:00:00Z'),
      },
    ],
  };

  const getDb = () => ({
    select() {
      return {
        from(table: unknown) {
          if (table === schema.userInvites) {
            return {
              where() {
                return {
                  orderBy() {
                    return {
                      limit: async () => bag.invites,
                    };
                  },
                };
              },
            };
          }
          return { where: () => ({ limit: async () => [] }) };
        },
      };
    },
  });

  return Object.assign(bag, { schema, getDb });
});

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/authUser', () => ({
  requireUser: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!invitesMocks.authOk || !auth.startsWith('Bearer valid-token')) return null;
    return { id: 'user-1', walletAddress: 'EQabc', role: 'user' };
  },
}));

vi.mock('../../db/client', () => ({
  getDb: invitesMocks.getDb,
  schema: invitesMocks.schema,
}));

import gamificationInvitesRoute, { GAMIFICATION_INVITES_PROBE as routeProbe } from '../../api/gamification/invites/route';

function invitesRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${GAMIFICATION_INVITES_PATH}`, { ...init, headers });
}

describe('gamificationInvites helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(GAMIFICATION_INVITES_PROBE.path).toBe('/api/gamification/invites');
    expect(routeProbe.authRequired).toBe(true);
    expect(routeProbe.listLimit).toBe(50);
  });
});

describe('/api/gamification/invites e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invitesMocks.authOk = true;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(GAMIFICATION_INVITES_PATH);
    expect(src).toContain('api/gamification/invites/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await gamificationInvitesRoute(invitesRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET without auth returns 401', async () => {
    invitesMocks.authOk = false;
    const res = await gamificationInvitesRoute(invitesRequest({ method: 'GET' }));
    expect(res.status).toBe(401);
  });

  it('GET returns user invites', async () => {
    const res = await gamificationInvitesRoute(
      invitesRequest({ method: 'GET', headers: { Authorization: 'Bearer valid-token' } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; invites: Array<{ id: string }> };
    expect(body.ok).toBe(true);
    expect(body.invites).toHaveLength(1);
    expect(body.invites[0]?.id).toBe('inv-1');
  });
});