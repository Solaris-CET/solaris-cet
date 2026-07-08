// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  isValidQuotePhone,
  parseQuoteBody,
  QUOTE_PATH,
  QUOTE_PROBE,
  validateQuoteFields,
} from '../../api/lib/quoteRequest';

const quoteMocks = vi.hoisted(() => ({
  insertedId: 'quote-1',
  emailCalls: 0,
  pushCalls: 0,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/emailProvider', () => ({
  sendEmail: vi.fn(async () => {
    quoteMocks.emailCalls += 1;
  }),
}));

vi.mock('../../api/lib/emailTemplates', () => ({
  internalLeadNotification: () => ({ subject: 'Quote', html: '<p>Quote</p>', text: 'Quote' }),
  clientConfirmationEmail: () => ({ subject: 'Thanks', html: '<p>Thanks</p>', text: 'Thanks' }),
}));

vi.stubGlobal(
  'fetch',
  vi.fn(async (url: string) => {
    if (url.includes('/api/push/notify-admin')) quoteMocks.pushCalls += 1;
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }),
);

vi.mock('../../db/client', () => ({
  getDb: () => ({
    insert() {
      return {
        values() {
          return {
            returning: async () => [{ id: quoteMocks.insertedId }],
          };
        },
      };
    },
  }),
}));

vi.mock('../../db/schema', () => ({
  quotes: { id: 'quotes.id' },
}));

import quoteRoute, { QUOTE_PROBE as routeProbe } from '../../api/quote/route';

const validQuote = {
  name: 'Ion Popescu',
  phone: '0769889721',
  email: 'ion@example.com',
  location: 'București',
  serviceType: 'fotovoltaic',
  powerNeeded: '5 kW',
  roofType: 'țiglă',
  message: 'Vreau ofertă',
};

function quoteRequest(body: unknown, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  headers.set('Content-Type', 'application/json');
  return new Request(`http://test${QUOTE_PATH}`, {
    method: 'POST',
    ...init,
    headers,
    body: JSON.stringify(body),
  });
}

describe('quoteRequest helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(QUOTE_PROBE.path).toBe('/api/quote');
    expect(routeProbe.serviceTypes).toContain('fotovoltaic');
    expect(routeProbe.authRequired).toBe(false);
  });

  it('parseQuoteBody and validateQuoteFields accept valid payload', () => {
    const fields = parseQuoteBody(validQuote);
    expect(fields?.serviceType).toBe('fotovoltaic');
    expect(validateQuoteFields(fields!)).toBeNull();
    expect(isValidQuotePhone('0769889721')).toBe(true);
    expect(isValidQuotePhone('123')).toBe(false);
  });

  it('validateQuoteFields rejects invalid service type input', () => {
    expect(parseQuoteBody({ ...validQuote, serviceType: 'invalid' })).toBeNull();
  });
});

describe('/api/quote e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    quoteMocks.emailCalls = 0;
    quoteMocks.pushCalls = 0;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(QUOTE_PATH);
    expect(src).toContain('api/quote/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await quoteRoute(
      new Request(`http://test${QUOTE_PATH}`, { method: 'OPTIONS', headers: { origin: 'https://allowed.test' } }),
    );
    expect(res.status).toBe(204);
  });

  it('POST stores quote and notifies admins', async () => {
    const res = await quoteRoute(quoteRequest(validQuote));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; message: string };
    expect(body.success).toBe(true);
    expect(body.message).toBe(QUOTE_PROBE.successMessage);
    expect(quoteMocks.pushCalls).toBe(1);
    expect(quoteMocks.emailCalls).toBeGreaterThanOrEqual(1);
  });

  it('POST with invalid phone returns 400', async () => {
    const res = await quoteRoute(quoteRequest({ ...validQuote, phone: '123' }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(QUOTE_PROBE.invalidPhoneError);
  });
});