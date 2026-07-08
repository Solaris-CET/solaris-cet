// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  MARKETING_LEAD_PATH,
  MARKETING_LEAD_PROBE,
  parseMarketingLeadBody,
  pickMarketingUtm,
} from '../../api/lib/marketingLead';

const marketingMocks = vi.hoisted(() => {
  const schema = {
    contacts: { email: 'contacts.email', id: 'contacts.id' },
    crmConversations: { contactId: 'crmConversations.contactId', id: 'crmConversations.id' },
    newsletterSubscriptions: { contactId: 'newsletterSubscriptions.contactId', status: 'newsletterSubscriptions.status', id: 'newsletterSubscriptions.id' },
    emailOutbox: { toEmail: 'emailOutbox.toEmail' },
  };

  const bag = {
    contactId: 'contact-1',
    conversationId: 'conv-1',
    existingNewsletter: false,
    outboxQueued: 0,
  };

  const getDb = () => ({
    insert(table: unknown) {
      return {
        values() {
          if (table === schema.emailOutbox) {
            bag.outboxQueued += 1;
            return Promise.resolve(undefined);
          }
          return {
            onConflictDoUpdate() {
              return {
                returning: async () => [{ id: bag.contactId, email: 'lead@example.com' }],
              };
            },
            returning: async () => {
              if (table === schema.crmConversations) return [{ id: bag.conversationId }];
              return [{ id: 'row-1' }];
            },
          };
        },
      };
    },
    select() {
      return {
        from() {
          return {
            where() {
              return {
                limit: async () => (bag.existingNewsletter ? [{ id: 'sub-1' }] : []),
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
  getDb: marketingMocks.getDb,
  schema: marketingMocks.schema,
}));

import marketingLeadRoute, { MARKETING_LEAD_PROBE as routeProbe } from '../../api/marketing/lead/route';

const validPayload = {
  email: 'lead@example.com',
  name: 'Ana',
  consent: true,
  newsletter: true,
  locale: 'ro',
  pageUrl: 'https://solaris-cet.com/prelaunch',
  utm: { utm_source: 'facebook', utm_campaign: 'prelaunch' },
};

function marketingRequest(body: unknown, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  headers.set('Content-Type', 'application/json');
  return new Request(`http://test${MARKETING_LEAD_PATH}`, {
    method: 'POST',
    ...init,
    headers,
    body: JSON.stringify(body),
  });
}

describe('marketingLead helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(MARKETING_LEAD_PROBE.path).toBe('/api/marketing/lead');
    expect(routeProbe.authRequired).toBe(false);
    expect(routeProbe.consentRequiredError).toBe('Consent required');
  });

  it('pickMarketingUtm extracts campaign fields', () => {
    expect(pickMarketingUtm({ utm_source: 'google', gclid: 'abc' })).toEqual({
      utm_source: 'google',
      utm_medium: undefined,
      utm_campaign: undefined,
      utm_term: undefined,
      utm_content: undefined,
      gclid: 'abc',
      fbclid: undefined,
      li_fat_id: undefined,
      campaign: undefined,
    });
    expect(pickMarketingUtm({})).toBeNull();
  });

  it('parseMarketingLeadBody normalizes payload', () => {
    const parsed = parseMarketingLeadBody(validPayload);
    expect(parsed?.email).toBe('lead@example.com');
    expect(parsed?.consent).toBe(true);
    expect(parsed?.utm).toMatchObject({ utm_source: 'facebook', utm_campaign: 'prelaunch' });
  });
});

describe('/api/marketing/lead e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    marketingMocks.existingNewsletter = false;
    marketingMocks.outboxQueued = 0;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(MARKETING_LEAD_PATH);
    expect(src).toContain('api/marketing/lead/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await marketingLeadRoute(
      new Request(`http://test${MARKETING_LEAD_PATH}`, { method: 'OPTIONS', headers: { origin: 'https://allowed.test' } }),
    );
    expect(res.status).toBe(204);
  });

  it('POST creates conversation and newsletter subscription', async () => {
    const res = await marketingLeadRoute(marketingRequest(validPayload));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; conversationId: string; subscribed: boolean };
    expect(body.ok).toBe(true);
    expect(body.conversationId).toBe('conv-1');
    expect(body.subscribed).toBe(true);
    expect(marketingMocks.outboxQueued).toBe(1);
  });

  it('POST without consent returns 400', async () => {
    const res = await marketingLeadRoute(marketingRequest({ ...validPayload, consent: false }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(MARKETING_LEAD_PROBE.consentRequiredError);
  });

  it('POST with invalid email returns 400', async () => {
    const res = await marketingLeadRoute(marketingRequest({ ...validPayload, email: 'not-an-email' }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(MARKETING_LEAD_PROBE.invalidEmailError);
  });
});