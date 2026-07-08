// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AUTH_CHALLENGE_PATH, AUTH_CHALLENGE_PROBE } from '../../api/lib/authChallenge';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
}));

import authChallengeRoute, { AUTH_CHALLENGE_PROBE as routeProbe } from '../../api/auth/challenge/route';

function challengeRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${AUTH_CHALLENGE_PATH}`, { ...init, headers });
}

describe('authChallenge helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(AUTH_CHALLENGE_PROBE.path).toBe('/api/auth/challenge');
    expect(routeProbe.rateLimitKey).toBe('auth-challenge');
    expect(routeProbe.challengeTtlMs).toBe(5 * 60 * 1000);
    expect(routeProbe.methods).toEqual(['GET', 'OPTIONS']);
  });
});

describe('/api/auth/challenge e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(AUTH_CHALLENGE_PATH);
    expect(src).toContain('api/auth/challenge/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await authChallengeRoute(challengeRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('GET returns challenge payload', async () => {
    const res = await authChallengeRoute(challengeRequest({ method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { payload: string; expiresAt: string };
    expect(body.payload.length).toBeGreaterThan(10);
    expect(new Date(body.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('POST returns 405', async () => {
    const res = await authChallengeRoute(challengeRequest({ method: 'POST' }));
    expect(res.status).toBe(405);
  });
});