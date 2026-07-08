// @vitest-environment node
import { authRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ACCOUNT_IDENTITIES_METHODS,
  ACCOUNT_IDENTITIES_PATH,
  ACCOUNT_IDENTITIES_PROBE,
  parseDeleteIdentityBody,
} from '../../api/lib/accountIdentities';

const mocks = vi.hoisted(() => {
  const user = {
    id: 'user-1',
    walletAddress: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const state = {
    telegram: {
      userId: 'user-1',
      telegramUserId: 'tg-99',
      username: 'tech_solaris',
      linkedAt: new Date('2026-02-01T10:00:00Z'),
    },
    oauth: [
      {
        id: 'oauth-1',
        userId: 'user-1',
        provider: 'github',
        providerUserId: 'gh-42',
        username: 'solaris-dev',
        linkedAt: new Date('2026-02-02T10:00:00Z'),
      },
    ],
    deleted: { telegram: 0, oauth: 0 },
  };

  const schema = {
    telegramLoginIdentities: { userId: 'telegramLoginIdentities.userId' },
    oauthIdentities: { userId: 'oauthIdentities.userId', provider: 'oauthIdentities.provider' },
    userSettings: { userId: 'userSettings.userId' },
    telegramLinks: { userId: 'telegramLinks.userId' },
  };

  const db = {
    select() {
      return {
        from(table: unknown) {
          return {
            where() {
              if (table === schema.oauthIdentities) {
                return Promise.resolve(state.oauth);
              }
              return {
                limit: async () => {
                  if (table === schema.telegramLoginIdentities) return [state.telegram];
                  if (table === schema.userSettings) return [];
                  if (table === schema.telegramLinks) return [];
                  return [];
                },
              };
            },
          };
        },
      };
    },
    delete(table: unknown) {
      return {
        where: async () => {
          if (table === schema.telegramLoginIdentities) state.deleted.telegram += 1;
          if (table === schema.oauthIdentities) state.deleted.oauth += 1;
        },
      };
    },
  };

  return { db, schema, state, user };
});

vi.mock('../../db/client', () => ({
  getDb: () => mocks.db,
  schema: mocks.schema,
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return { user: mocks.user, sid: null, mfaEnabled: false };
  },
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/originGuard', () => ({
  ensureAllowedOrigin: () => ({ allowedOrigin: 'https://allowed.test' }),
}));

import accountIdentitiesRoute, { ACCOUNT_IDENTITIES_PROBE as routeProbe } from '../../api/account/identities/route';

describe('accountIdentities helpers', () => {
  it('parseDeleteIdentityBody validates telegram and oauth payloads', () => {
    expect(parseDeleteIdentityBody({ type: 'telegram' })).toEqual({ type: 'telegram', provider: '' });
    expect(parseDeleteIdentityBody({ type: 'oauth', provider: 'GitHub' })).toEqual({
      type: 'oauth',
      provider: 'github',
    });
    expect(parseDeleteIdentityBody({ type: 'oauth' })).toEqual({ error: 'Missing provider' });
    expect(parseDeleteIdentityBody({ type: 'wallet' })).toEqual({ error: 'Invalid type' });
  });

  it('exports stable e2e probe contract', () => {
    expect(ACCOUNT_IDENTITIES_PROBE.path).toBe('/api/account/identities');
    expect(ACCOUNT_IDENTITIES_PROBE.authRequired).toBe(true);
    expect(ACCOUNT_IDENTITIES_PROBE.unauthenticatedStatus).toBe(401);
    expect(routeProbe.methods).toEqual(['GET', 'DELETE', 'OPTIONS']);
  });
});

describe('/api/account/identities e2e probe', () => {
  beforeEach(() => {
    mocks.state.deleted.telegram = 0;
    mocks.state.deleted.oauth = 0;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ACCOUNT_IDENTITIES_PATH);
    expect(src).toContain('api/account/identities/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await accountIdentitiesRoute(
      new Request(`http://test${ACCOUNT_IDENTITIES_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('DELETE');
    expect(ACCOUNT_IDENTITIES_METHODS).toContain('OPTIONS');
  });

  it('GET requires Authorization bearer token', async () => {
    const res = await accountIdentitiesRoute(
      new Request(`http://test${ACCOUNT_IDENTITIES_PATH}`, {
        method: 'GET',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(ACCOUNT_IDENTITIES_PROBE.unauthenticatedStatus);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Unauthorized');
  });

  it('GET returns linked telegram and oauth identities', async () => {
    const res = await accountIdentitiesRoute(authRequest(ACCOUNT_IDENTITIES_PATH, { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      telegramLogin: { telegramUserId: string } | null;
      oauth: Array<{ provider: string }>;
    };
    expect(body.ok).toBe(true);
    expect(body.telegramLogin?.telegramUserId).toBe('tg-99');
    expect(body.oauth[0]?.provider).toBe('github');
  });

  it('DELETE unlinks oauth provider', async () => {
    const res = await accountIdentitiesRoute(
      authRequest(ACCOUNT_IDENTITIES_PATH, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'oauth', provider: 'github' }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    expect(mocks.state.deleted.oauth).toBe(1);
  });

  it('DELETE rejects invalid unlink type', async () => {
    const res = await accountIdentitiesRoute(
      authRequest(ACCOUNT_IDENTITIES_PATH, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'twitter' }),
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Invalid type');
  });

  it('DELETE rejects unsupported HTTP verbs via 405', async () => {
    const res = await accountIdentitiesRoute(authRequest(ACCOUNT_IDENTITIES_PATH, { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});