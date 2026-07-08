// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CONSENT_PATH, CONSENT_PROBE, parseConsentPostBody } from '../../api/lib/consent';

const consentMocks = vi.hoisted(() => ({
  insertedId: 'consent-1',
  userId: null as string | null,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
}));

vi.mock('../../api/lib/authUser', () => ({
  requireUser: async () => (consentMocks.userId ? { id: consentMocks.userId, walletAddress: 'EQabc', role: 'user' } : null),
}));

vi.mock('../../api/lib/clientIp', () => ({
  clientIp: () => '127.0.0.1',
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    insert() {
      return {
        values() {
          return {
            returning: async () => [{ id: consentMocks.insertedId }],
          };
        },
      };
    },
  }),
  schema: {
    consentProofs: { id: 'consentProofs.id' },
  },
}));

import consentRoute, { CONSENT_PROBE as routeProbe } from '../../api/consent/route';

function consentRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${CONSENT_PATH}`, { ...init, headers });
}

const validPayload = {
  consentKey: 'visitor-abc',
  consent: { analytics: true, marketing: false },
  policyVersion: '2026-01',
  source: 'banner',
};

describe('consent helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(CONSENT_PROBE.path).toBe('/api/consent');
    expect(routeProbe.rateLimitKey).toBe('consent');
    expect(routeProbe.essentialConsent).toBe(true);
  });

  it('parseConsentPostBody validates required fields', () => {
    expect(parseConsentPostBody(validPayload)).toEqual({
      consentKey: 'visitor-abc',
      consent: { analytics: true, marketing: false },
      policyVersion: '2026-01',
      policyHash: null,
      source: 'banner',
      meta: null,
    });
    expect(parseConsentPostBody({ consentKey: '' })).toBeNull();
  });
});

describe('/api/consent e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consentMocks.userId = null;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(CONSENT_PATH);
    expect(src).toContain('api/consent/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await consentRoute(consentRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('POST stores consent proof', async () => {
    const res = await consentRoute(consentRequest({ method: 'POST', body: JSON.stringify(validPayload) }));
    expect(res.status).toBe(201);
    const body = (await res.json()) as { ok: boolean; id: string };
    expect(body.ok).toBe(true);
    expect(body.id).toBe('consent-1');
  });

  it('POST with invalid payload returns 400', async () => {
    const res = await consentRoute(consentRequest({ method: 'POST', body: JSON.stringify({ consentKey: 'x' }) }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(CONSENT_PROBE.invalidPayloadError);
  });

  it('GET returns 405', async () => {
    const res = await consentRoute(consentRequest({ method: 'GET' }));
    expect(res.status).toBe(405);
  });
});