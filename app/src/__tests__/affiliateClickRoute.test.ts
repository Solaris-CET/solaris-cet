// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AFFILIATE_CLICK_PATH, AFFILIATE_CLICK_PROBE, parseAffiliateClickCode } from '../../api/lib/affiliateClick';

const clickMocks = vi.hoisted(() => ({
  bumped: false,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({}),
}));

vi.mock('../../api/gamification/lib/gamification', () => ({
  bootstrapGamification: async () => undefined,
  bumpAffiliateClick: async () => {
    clickMocks.bumped = true;
  },
  todayKeyUtc: () => '2026-07-07',
}));

import affiliateClickRoute, { AFFILIATE_CLICK_PROBE as routeProbe } from '../../api/gamification/affiliate/click/route';

function clickRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${AFFILIATE_CLICK_PATH}`, { ...init, headers });
}

describe('affiliateClick helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(AFFILIATE_CLICK_PROBE.path).toBe('/api/gamification/affiliate/click');
    expect(routeProbe.rateLimitKey).toBe('affiliate-click');
    expect(routeProbe.authRequired).toBe(false);
  });

  it('parseAffiliateClickCode trims code', () => {
    expect(parseAffiliateClickCode({ code: '  ABC123  ' })).toBe('ABC123');
    expect(parseAffiliateClickCode({})).toBe('');
  });
});

describe('/api/gamification/affiliate/click e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clickMocks.bumped = false;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(AFFILIATE_CLICK_PATH);
    expect(src).toContain('api/gamification/affiliate/click/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await affiliateClickRoute(clickRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('POST without code returns 400', async () => {
    const res = await affiliateClickRoute(clickRequest({ method: 'POST', body: JSON.stringify({}) }));
    expect(res.status).toBe(400);
  });

  it('POST records affiliate click', async () => {
    const res = await affiliateClickRoute(clickRequest({ method: 'POST', body: JSON.stringify({ code: 'REFCODE' }) }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    expect(clickMocks.bumped).toBe(true);
  });
});