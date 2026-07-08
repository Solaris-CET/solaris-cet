// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildLeadRecord,
  isLeadHoneypotTriggered,
  LEAD_PATH,
  LEAD_PROBE,
  parseLeadFields,
  validateLeadRequiredFields,
} from '../../api/lib/leadCapture';

const leadMocks = vi.hoisted(() => ({
  mkdirCalls: 0,
  writeCalls: 0,
  appendCalls: 0,
  emailCalls: 0,
  pushCalls: 0,
}));

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    promises: {
      ...actual.promises,
      mkdir: vi.fn(async () => {
        leadMocks.mkdirCalls += 1;
      }),
      writeFile: vi.fn(async () => {
        leadMocks.writeCalls += 1;
      }),
      appendFile: vi.fn(async () => {
        leadMocks.appendCalls += 1;
      }),
    },
  };
});

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/clientIp', () => ({
  clientIp: () => '203.0.113.10',
}));

vi.mock('../../api/lib/emailProvider', () => ({
  sendEmail: vi.fn(async () => {
    leadMocks.emailCalls += 1;
  }),
}));

vi.mock('../../api/lib/emailTemplates', () => ({
  internalLeadNotification: () => ({ subject: 'Lead', html: '<p>Lead</p>', text: 'Lead' }),
  clientConfirmationEmail: () => ({ subject: 'Thanks', html: '<p>Thanks</p>', text: 'Thanks' }),
}));

vi.stubGlobal(
  'fetch',
  vi.fn(async (url: string) => {
    if (url.includes('/api/push/notify-admin')) {
      leadMocks.pushCalls += 1;
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }),
);

import leadRoute, { LEAD_PROBE as routeProbe } from '../../api/lead/route';

const validLead = {
  name: 'Ion Popescu',
  telefon: '0769889721',
  email: 'ion@example.com',
  serviciu: 'Panouri solare',
  judet: 'București',
};

function leadRequest(body: Record<string, string>, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  headers.set('Content-Type', 'application/json');
  return new Request(`http://test${LEAD_PATH}`, {
    method: 'POST',
    ...init,
    headers,
    body: JSON.stringify(body),
  });
}

describe('leadCapture helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(LEAD_PROBE.path).toBe('/api/lead');
    expect(routeProbe.authRequired).toBe(false);
    expect(routeProbe.thankYouPath).toBe('/multumim/');
  });

  it('parseLeadFields normalizes aliases', () => {
    const fields = parseLeadFields({
      name: ' Ana ',
      phone: '07 698 897 21',
      service: 'Instalare',
      county: 'Cluj',
      message: 'Detalii',
    });
    expect(fields.name).toBe('Ana');
    expect(fields.telefon.replace(/[^0-9]/g, '').length).toBeGreaterThanOrEqual(LEAD_PROBE.minPhoneDigits);
    expect(fields.serviciu).toBe('Instalare');
    expect(fields.judet).toBe('Cluj');
    expect(fields.detalii).toBe('Detalii');
  });

  it('validateLeadRequiredFields rejects short phone', () => {
    expect(validateLeadRequiredFields(parseLeadFields({ ...validLead, telefon: '123' }))).toBe(
      LEAD_PROBE.invalidPhoneError,
    );
    expect(validateLeadRequiredFields(parseLeadFields(validLead))).toBeNull();
  });

  it('isLeadHoneypotTriggered detects bot fields', () => {
    expect(isLeadHoneypotTriggered({ honeypot: 'spam' })).toBe(true);
    expect(isLeadHoneypotTriggered({ name: 'x' })).toBe(false);
  });

  it('buildLeadRecord captures request metadata', () => {
    const req = new Request('http://test/api/lead', {
      headers: { referer: 'https://solaris-cet.com/contact', 'user-agent': 'vitest' },
    });
    const record = buildLeadRecord(req, parseLeadFields(validLead));
    expect(record.name).toBe('Ion Popescu');
    expect(record.ip).toBe('203.0.113.10');
    expect(record.pageUrl).toContain('contact');
  });
});

describe('/api/lead e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    leadMocks.mkdirCalls = 0;
    leadMocks.writeCalls = 0;
    leadMocks.appendCalls = 0;
    leadMocks.emailCalls = 0;
    leadMocks.pushCalls = 0;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(LEAD_PATH);
    expect(src).toContain('api/lead/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await leadRoute(
      new Request(`http://test${LEAD_PATH}`, { method: 'OPTIONS', headers: { origin: 'https://allowed.test' } }),
    );
    expect(res.status).toBe(204);
  });

  it('POST with valid JSON stores lead and notifies', async () => {
    const res = await leadRoute(leadRequest(validLead));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; redirect: string };
    expect(body.success).toBe(true);
    expect(body.redirect).toBe(LEAD_PROBE.thankYouPath);
    expect(leadMocks.mkdirCalls).toBe(1);
    expect(leadMocks.writeCalls).toBe(1);
    expect(leadMocks.appendCalls).toBe(1);
    expect(leadMocks.emailCalls).toBeGreaterThanOrEqual(1);
    expect(leadMocks.pushCalls).toBe(1);
  });

  it('POST honeypot returns success without persisting', async () => {
    const res = await leadRoute(leadRequest({ ...validLead, honeypot: 'bot' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);
    expect(leadMocks.writeCalls).toBe(0);
  });

  it('POST missing fields returns 400', async () => {
    const res = await leadRoute(leadRequest({ name: 'Ion' }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(LEAD_PROBE.missingFieldsError);
  });
});