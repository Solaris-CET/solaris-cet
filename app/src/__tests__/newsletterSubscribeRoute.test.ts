// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  NEWSLETTER_SUBSCRIBE_PATH,
  NEWSLETTER_SUBSCRIBE_PROBE,
  parseNewsletterSubscribeBody,
} from '../../api/lib/newsletterSubscribe';

const subscribeMocks = vi.hoisted(() => {
  const schema = {
    contacts: { email: 'contacts.email', id: 'contacts.id' },
    newsletterSubscriptions: { contactId: 'newsletterSubscriptions.contactId' },
    emailOutbox: { toEmail: 'emailOutbox.toEmail' },
  };

  const bag = {
    contactId: 'contact-1',
    outboxQueued: 0,
    subscriptionCreated: false,
  };

  const getDb = () => ({
    insert(table: unknown) {
      return {
        values() {
          if (table === schema.emailOutbox) {
            bag.outboxQueued += 1;
            return Promise.resolve(undefined);
          }
          if (table === schema.newsletterSubscriptions) {
            bag.subscriptionCreated = true;
            return Promise.resolve(undefined);
          }
          return {
            onConflictDoUpdate() {
              return {
                returning: async () => [{ id: bag.contactId, email: 'sub@example.com' }],
              };
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

vi.mock('../../api/lib/publicOrigin', () => ({
  publicOrigin: () => 'https://solaris-cet.com',
}));

vi.mock('../../api/lib/emailTemplates', () => ({
  newsletterVerifyEmail: () => ({ subject: 'Verify', html: '<p>Verify</p>', text: 'Verify' }),
}));

vi.mock('../../db/client', () => ({
  getDb: subscribeMocks.getDb,
  schema: subscribeMocks.schema,
}));

import newsletterSubscribeRoute, { NEWSLETTER_SUBSCRIBE_PROBE as routeProbe } from '../../api/newsletter/subscribe/route';

const validPayload = { email: 'sub@example.com', consent: true, locale: 'ro' };

function subscribeRequest(body: unknown, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  headers.set('Content-Type', 'application/json');
  return new Request(`http://test${NEWSLETTER_SUBSCRIBE_PATH}`, {
    method: 'POST',
    ...init,
    headers,
    body: JSON.stringify(body),
  });
}

describe('newsletterSubscribe helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(NEWSLETTER_SUBSCRIBE_PROBE.path).toBe('/api/newsletter/subscribe');
    expect(routeProbe.authRequired).toBe(false);
    expect(routeProbe.verifyTemplate).toBe('newsletter_verify');
  });

  it('parseNewsletterSubscribeBody normalizes payload', () => {
    expect(parseNewsletterSubscribeBody(validPayload)).toEqual({
      email: 'sub@example.com',
      locale: 'ro',
      consent: true,
    });
    expect(parseNewsletterSubscribeBody({ email: 'x' })).toEqual({ email: 'x', locale: null, consent: false });
  });
});

describe('/api/newsletter/subscribe e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    subscribeMocks.outboxQueued = 0;
    subscribeMocks.subscriptionCreated = false;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(NEWSLETTER_SUBSCRIBE_PATH);
    expect(src).toContain('api/newsletter/subscribe/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await newsletterSubscribeRoute(
      new Request(`http://test${NEWSLETTER_SUBSCRIBE_PATH}`, { method: 'OPTIONS', headers: { origin: 'https://allowed.test' } }),
    );
    expect(res.status).toBe(204);
  });

  it('POST queues verify email', async () => {
    const res = await newsletterSubscribeRoute(subscribeRequest(validPayload));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    expect(subscribeMocks.subscriptionCreated).toBe(true);
    expect(subscribeMocks.outboxQueued).toBe(1);
  });

  it('POST without consent returns 400', async () => {
    const res = await newsletterSubscribeRoute(subscribeRequest({ ...validPayload, consent: false }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(NEWSLETTER_SUBSCRIBE_PROBE.consentRequiredError);
  });
});