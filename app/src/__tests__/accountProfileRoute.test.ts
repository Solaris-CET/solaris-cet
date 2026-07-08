// @vitest-environment node
import { authRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ACCOUNT_PROFILE_METHODS,
  ACCOUNT_PROFILE_PATH,
  ACCOUNT_PROFILE_PROBE,
  parseProfileUpdateBody,
} from '../../api/lib/accountProfile';

const mocks = vi.hoisted(() => {
  const state = {
    prefs: {
      userId: 'user-1',
      marketingNewsletter: true,
      priceAlertsEmail: false,
      pushEnabled: true,
    },
    contact: {
      id: 'contact-1',
      userId: 'user-1',
      email: 'user@example.com',
      createdAt: new Date('2026-01-15T00:00:00Z'),
    },
    newsletter: {
      contactId: 'contact-1',
      status: 'active',
      createdAt: new Date('2026-01-20T00:00:00Z'),
    },
    upserts: { contacts: 0, prefs: 0 },
  };

  const schema = {
    notificationPreferences: { userId: 'notificationPreferences.userId' },
    contacts: { userId: 'contacts.userId', email: 'contacts.email' },
    newsletterSubscriptions: { contactId: 'newsletterSubscriptions.contactId' },
  };

  const db = {
    select() {
      return {
        from(table: unknown) {
          return {
            where() {
              return {
                orderBy() {
                  return {
                    limit: async () => {
                      if (table === schema.contacts) return [state.contact];
                      if (table === schema.newsletterSubscriptions) return [state.newsletter];
                      return [];
                    },
                  };
                },
                limit: async () => {
                  if (table === schema.notificationPreferences) return [state.prefs];
                  return [];
                },
              };
            },
          };
        },
      };
    },
    insert(table: unknown) {
      return {
        values() {
          return {
            onConflictDoUpdate: async () => {
              if (table === schema.contacts) state.upserts.contacts += 1;
              if (table === schema.notificationPreferences) state.upserts.prefs += 1;
            },
          };
        },
      };
    },
  };

  return { db, schema, state };
});

vi.mock('../../db/client', () => ({
  getDb: () => mocks.db,
  schema: mocks.schema,
}));

vi.mock('../../api/lib/authUser', () => ({
  requireUser: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!auth.startsWith('Bearer valid-token')) return null;
    return { id: 'user-1', walletAddress: 'EQ_WALLET', role: 'user' };
  },
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import accountProfileRoute, { ACCOUNT_PROFILE_PROBE as routeProbe } from '../../api/account/profile/route';

describe('accountProfile helpers', () => {
  it('parseProfileUpdateBody normalizes email and booleans', () => {
    expect(
      parseProfileUpdateBody({
        email: ' User@Example.com ',
        marketingNewsletter: true,
        priceAlertsEmail: 'yes',
        pushEnabled: 0,
      }),
    ).toEqual({
      email: 'user@example.com',
      marketingNewsletter: true,
      priceAlertsEmail: true,
      pushEnabled: false,
    });
    expect(parseProfileUpdateBody({ email: 'not-an-email' })).toEqual({ error: 'Invalid email' });
  });

  it('exports stable e2e probe contract', () => {
    expect(ACCOUNT_PROFILE_PROBE.path).toBe('/api/account/profile');
    expect(ACCOUNT_PROFILE_PROBE.authRequired).toBe(true);
    expect(routeProbe.methods).toEqual(['GET', 'POST', 'OPTIONS']);
    expect(ACCOUNT_PROFILE_METHODS).toContain('POST');
  });
});

describe('/api/account/profile e2e probe', () => {
  beforeEach(() => {
    mocks.state.upserts.contacts = 0;
    mocks.state.upserts.prefs = 0;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ACCOUNT_PROFILE_PATH);
    expect(src).toContain('api/account/profile/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await accountProfileRoute(
      new Request(`http://test${ACCOUNT_PROFILE_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('GET requires Authorization bearer token', async () => {
    const res = await accountProfileRoute(
      new Request(`http://test${ACCOUNT_PROFILE_PATH}`, {
        method: 'GET',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(ACCOUNT_PROFILE_PROBE.unauthenticatedStatus);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Unauthorized');
  });

  it('GET returns profile, preferences, and newsletter status', async () => {
    const res = await accountProfileRoute(authRequest(ACCOUNT_PROFILE_PATH, { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      email: string;
      user: { walletAddress: string; role: string };
      preferences: { marketingNewsletter: boolean };
      newsletter: { status: string } | null;
    };
    expect(body.ok).toBe(true);
    expect(body.email).toBe('user@example.com');
    expect(body.user.walletAddress).toBe('EQ_WALLET');
    expect(body.preferences.marketingNewsletter).toBe(true);
    expect(body.newsletter?.status).toBe('active');
  });

  it('POST rejects invalid JSON', async () => {
    const res = await accountProfileRoute(
      authRequest(ACCOUNT_PROFILE_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{bad-json',
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Invalid JSON');
  });

  it('POST upserts contact email and notification preferences', async () => {
    const res = await accountProfileRoute(
      authRequest(ACCOUNT_PROFILE_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'new@example.com',
          marketingNewsletter: false,
          priceAlertsEmail: true,
          pushEnabled: true,
        }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    expect(mocks.state.upserts.contacts).toBe(1);
    expect(mocks.state.upserts.prefs).toBe(1);
  });

  it('DELETE returns 405', async () => {
    const res = await accountProfileRoute(authRequest(ACCOUNT_PROFILE_PATH, { method: 'DELETE' }));
    expect(res.status).toBe(405);
  });
});