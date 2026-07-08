// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isValidWaitlistEmail, parseWaitlistEmail, WAITLIST_PATH, WAITLIST_PROBE } from '../../api/lib/waitlist';

const fetchMock = vi.fn();

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: (origin: string | null) => origin ?? '*',
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
}));

import waitlistRoute, { WAITLIST_PROBE as routeProbe } from '../../api/waitlist/route';

function waitlistRequest(body: unknown, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  headers.set('Content-Type', 'application/json');
  return new Request(`http://test${WAITLIST_PATH}`, { method: 'POST', ...init, headers, body: JSON.stringify(body) });
}

describe('waitlist helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(WAITLIST_PROBE.path).toBe('/api/waitlist');
    expect(routeProbe.runtime).toBe('edge');
  });

  it('isValidWaitlistEmail validates format', () => {
    expect(isValidWaitlistEmail('user@example.com')).toBe(true);
    expect(isValidWaitlistEmail('bad')).toBe(false);
    expect(parseWaitlistEmail({ email: ' user@example.com ' })).toBe('user@example.com');
  });
});

describe('/api/waitlist e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.WAITLIST_WEBHOOK_URL;
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(WAITLIST_PATH);
    expect(src).toContain('api/waitlist/route.js');
  });

  it('POST without webhook configured returns 503', async () => {
    const res = await waitlistRoute(waitlistRequest({ email: 'user@example.com' }));
    expect(res.status).toBe(503);
  });

  it('POST with webhook posts email upstream', async () => {
    process.env.WAITLIST_WEBHOOK_URL = 'https://hooks.test/waitlist';
    fetchMock.mockResolvedValueOnce({ ok: true });
    const res = await waitlistRoute(waitlistRequest({ email: 'user@example.com' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://hooks.test/waitlist',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ email: 'user@example.com' }) }),
    );
  });
});