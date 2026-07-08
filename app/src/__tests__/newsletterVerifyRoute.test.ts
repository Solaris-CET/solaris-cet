// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  NEWSLETTER_VERIFY_PATH,
  NEWSLETTER_VERIFY_PROBE,
  parseNewsletterVerifyToken,
} from '../../api/lib/newsletterVerify';

const verifyMocks = vi.hoisted(() => {
  const schema = {
    newsletterSubscriptions: {
      id: 'newsletterSubscriptions.id',
      verifyToken: 'newsletterSubscriptions.verifyToken',
      status: 'newsletterSubscriptions.status',
      contactId: 'newsletterSubscriptions.contactId',
    },
    contacts: { id: 'contacts.id', email: 'contacts.email' },
  };

  const bag = {
    record: {
      id: 'sub-1',
      verifyToken: 'verify-token-abc',
      status: 'pending' as 'pending' | 'active' | 'unsubscribed',
      contactId: 'contact-1',
    },
    found: true,
    updated: false,
    activationQueued: false,
  };

  const getDb = () => ({
    select() {
      return {
        from(table: unknown) {
          return {
            where() {
              return {
                limit: async () => {
                  if (table === schema.newsletterSubscriptions) return bag.found ? [bag.record] : [];
                  if (table === schema.contacts) return [{ id: 'contact-1', email: 'sub@example.com' }];
                  return [];
                },
              };
            },
          };
        },
      };
    },
    update() {
      return {
        set() {
          return {
            where: async () => {
              bag.updated = true;
              bag.record.status = 'active';
            },
          };
        },
      };
    },
  });

  return Object.assign(bag, { schema, getDb });
});

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/newsletterActivation', () => ({
  queueNewsletterActivationEmails: vi.fn(async () => {
    verifyMocks.activationQueued = true;
  }),
}));

vi.mock('../../db/client', () => ({
  getDb: verifyMocks.getDb,
  schema: verifyMocks.schema,
}));

import newsletterVerifyRoute, { NEWSLETTER_VERIFY_PROBE as routeProbe } from '../../api/newsletter/verify/route';

function verifyRequest(query = '', init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${NEWSLETTER_VERIFY_PATH}${query}`, { ...init, headers });
}

describe('newsletterVerify helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(NEWSLETTER_VERIFY_PROBE.path).toBe('/api/newsletter/verify');
    expect(routeProbe.statusVerified).toBe('verified');
    expect(routeProbe.queryParam).toBe('token');
  });

  it('parseNewsletterVerifyToken reads query param', () => {
    expect(parseNewsletterVerifyToken(new URL('http://test/api/newsletter/verify?token=abc'))).toBe('abc');
    expect(parseNewsletterVerifyToken(new URL('http://test/api/newsletter/verify'))).toBeNull();
  });
});

describe('/api/newsletter/verify e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifyMocks.found = true;
    verifyMocks.record.status = 'pending';
    verifyMocks.updated = false;
    verifyMocks.activationQueued = false;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(NEWSLETTER_VERIFY_PATH);
    expect(src).toContain('api/newsletter/verify/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await newsletterVerifyRoute(verifyRequest('', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET without token returns 400', async () => {
    const res = await newsletterVerifyRoute(verifyRequest('', { method: 'GET' }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(NEWSLETTER_VERIFY_PROBE.missingTokenError);
  });

  it('GET verifies pending subscription', async () => {
    const res = await newsletterVerifyRoute(verifyRequest('?token=verify-token-abc', { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; status: string };
    expect(body.ok).toBe(true);
    expect(body.status).toBe(NEWSLETTER_VERIFY_PROBE.statusVerified);
    expect(verifyMocks.updated).toBe(true);
    expect(verifyMocks.activationQueued).toBe(true);
  });

  it('GET active subscription returns already_active', async () => {
    verifyMocks.record.status = 'active';
    const res = await newsletterVerifyRoute(verifyRequest('?token=verify-token-abc', { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe(NEWSLETTER_VERIFY_PROBE.statusAlreadyActive);
  });

  it('GET unsubscribed subscription returns 409', async () => {
    verifyMocks.record.status = 'unsubscribed';
    const res = await newsletterVerifyRoute(verifyRequest('?token=verify-token-abc', { method: 'GET' }));
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(NEWSLETTER_VERIFY_PROBE.unsubscribedError);
  });
});