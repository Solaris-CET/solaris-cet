// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  isValidNewsletterConfirmToken,
  NEWSLETTER_CONFIRM_PATH,
  NEWSLETTER_CONFIRM_PROBE,
  parseNewsletterConfirmToken,
} from '../../api/lib/newsletterConfirm';

const confirmMocks = vi.hoisted(() => {
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
      verifyToken: 'valid-token-1234567890',
      status: 'pending' as 'pending' | 'active',
      contactId: 'contact-1',
    },
    activationQueued: false,
    updated: false,
  };

  const getDb = () => ({
    select() {
      return {
        from(table: unknown) {
          return {
            where() {
              return {
                limit: async () => {
                  if (table === schema.newsletterSubscriptions) return [bag.record];
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
  getAllowedOrigin: (origin: string | null) => origin ?? 'https://allowed.test',
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
}));

vi.mock('../../api/lib/newsletterActivation', () => ({
  queueNewsletterActivationEmails: vi.fn(async () => {
    confirmMocks.activationQueued = true;
  }),
}));

vi.mock('../../db/client', () => ({
  getDb: confirmMocks.getDb,
  schema: confirmMocks.schema,
}));

import newsletterConfirmRoute, { NEWSLETTER_CONFIRM_PROBE as routeProbe } from '../../api/newsletter/confirm/route';

function confirmRequest(body: unknown, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  headers.set('Content-Type', 'application/json');
  return new Request(`http://test${NEWSLETTER_CONFIRM_PATH}`, {
    method: 'POST',
    ...init,
    headers,
    body: JSON.stringify(body),
  });
}

describe('newsletterConfirm helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(NEWSLETTER_CONFIRM_PROBE.path).toBe('/api/newsletter/confirm');
    expect(routeProbe.rateLimitKey).toBe('newsletter-confirm');
    expect(routeProbe.statusConfirmed).toBe('confirmed');
  });

  it('parseNewsletterConfirmToken and isValidNewsletterConfirmToken', () => {
    expect(parseNewsletterConfirmToken({ token: '  abcdefghij  ' })).toBe('abcdefghij');
    expect(isValidNewsletterConfirmToken('short')).toBe(false);
    expect(isValidNewsletterConfirmToken('valid-token-1234567890')).toBe(true);
  });
});

describe('/api/newsletter/confirm e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    confirmMocks.record.status = 'pending';
    confirmMocks.updated = false;
    confirmMocks.activationQueued = false;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(NEWSLETTER_CONFIRM_PATH);
    expect(src).toContain('api/newsletter/confirm/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await newsletterConfirmRoute(
      new Request(`http://test${NEWSLETTER_CONFIRM_PATH}`, { method: 'OPTIONS', headers: { origin: 'https://allowed.test' } }),
    );
    expect(res.status).toBe(204);
  });

  it('POST confirms pending subscription', async () => {
    const res = await newsletterConfirmRoute(confirmRequest({ token: 'valid-token-1234567890' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe(NEWSLETTER_CONFIRM_PROBE.statusConfirmed);
    expect(confirmMocks.updated).toBe(true);
    expect(confirmMocks.activationQueued).toBe(true);
  });

  it('POST with short token returns invalid status', async () => {
    const res = await newsletterConfirmRoute(confirmRequest({ token: 'short' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe(NEWSLETTER_CONFIRM_PROBE.statusInvalid);
  });

  it('POST for active subscription returns already_confirmed', async () => {
    confirmMocks.record.status = 'active';
    const res = await newsletterConfirmRoute(confirmRequest({ token: 'valid-token-1234567890' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe(NEWSLETTER_CONFIRM_PROBE.statusAlreadyConfirmed);
  });
});