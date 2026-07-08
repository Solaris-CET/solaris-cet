// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  NEWSLETTER_UNSUBSCRIBE_PATH,
  NEWSLETTER_UNSUBSCRIBE_PROBE,
  parseNewsletterUnsubscribeToken,
} from '../../api/lib/newsletterUnsubscribe';

const unsubscribeMocks = vi.hoisted(() => {
  const schema = {
    newsletterSubscriptions: {
      id: 'newsletterSubscriptions.id',
      unsubscribeToken: 'newsletterSubscriptions.unsubscribeToken',
      status: 'newsletterSubscriptions.status',
    },
  };

  const bag = {
    record: {
      id: 'sub-1',
      unsubscribeToken: 'unsub-token-abc',
      status: 'active' as 'active' | 'unsubscribed',
    },
    found: true,
    updated: false,
  };

  const getDb = () => ({
    select() {
      return {
        from() {
          return {
            where() {
              return {
                limit: async () => (bag.found ? [bag.record] : []),
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
              bag.record.status = 'unsubscribed';
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

vi.mock('../../db/client', () => ({
  getDb: unsubscribeMocks.getDb,
  schema: unsubscribeMocks.schema,
}));

import newsletterUnsubscribeRoute, { NEWSLETTER_UNSUBSCRIBE_PROBE as routeProbe } from '../../api/newsletter/unsubscribe/route';

function unsubscribeRequest(query = '', init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${NEWSLETTER_UNSUBSCRIBE_PATH}${query}`, { ...init, headers });
}

describe('newsletterUnsubscribe helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(NEWSLETTER_UNSUBSCRIBE_PROBE.path).toBe('/api/newsletter/unsubscribe');
    expect(routeProbe.queryParam).toBe('token');
    expect(routeProbe.statusUnsubscribed).toBe('unsubscribed');
  });

  it('parseNewsletterUnsubscribeToken reads query param', () => {
    expect(parseNewsletterUnsubscribeToken(new URL('http://test/api/newsletter/unsubscribe?token=abc'))).toBe('abc');
    expect(parseNewsletterUnsubscribeToken(new URL('http://test/api/newsletter/unsubscribe'))).toBeNull();
  });
});

describe('/api/newsletter/unsubscribe e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    unsubscribeMocks.found = true;
    unsubscribeMocks.record.status = 'active';
    unsubscribeMocks.updated = false;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(NEWSLETTER_UNSUBSCRIBE_PATH);
    expect(src).toContain('api/newsletter/unsubscribe/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await newsletterUnsubscribeRoute(unsubscribeRequest('', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET without token returns 400', async () => {
    const res = await newsletterUnsubscribeRoute(unsubscribeRequest('', { method: 'GET' }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(NEWSLETTER_UNSUBSCRIBE_PROBE.missingTokenError);
  });

  it('GET unsubscribes active subscription', async () => {
    const res = await newsletterUnsubscribeRoute(unsubscribeRequest('?token=unsub-token-abc', { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; status: string };
    expect(body.ok).toBe(true);
    expect(body.status).toBe(NEWSLETTER_UNSUBSCRIBE_PROBE.statusUnsubscribed);
    expect(unsubscribeMocks.updated).toBe(true);
  });

  it('GET already unsubscribed returns already_unsubscribed', async () => {
    unsubscribeMocks.record.status = 'unsubscribed';
    const res = await newsletterUnsubscribeRoute(unsubscribeRequest('?token=unsub-token-abc', { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe(NEWSLETTER_UNSUBSCRIBE_PROBE.statusAlreadyUnsubscribed);
  });
});