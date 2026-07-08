// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OAUTH_TWITTER_START_PATH, OAUTH_TWITTER_START_PROBE } from '../../api/lib/oauthTwitterStart';

vi.mock('../../api/lib/originGuard', () => ({
  ensureAllowedOrigin: () => ({ allowedOrigin: 'https://allowed.test' }),
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async () => ({ error: 'Unauthorized', status: 401 }),
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    insert() {
      return { values: async () => undefined };
    },
  }),
  schema: { oauthStates: { state: 'oauthStates.state' } },
}));

import oauthTwitterStartRoute, { OAUTH_TWITTER_START_PROBE as routeProbe } from '../../api/auth/oauth/twitter/start/route';

function startRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${OAUTH_TWITTER_START_PATH}`, { ...init, headers });
}

describe('oauthTwitterStart helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(OAUTH_TWITTER_START_PROBE.path).toBe('/api/auth/oauth/twitter/start');
    expect(routeProbe.provider).toBe('twitter');
    expect(routeProbe.methods).toEqual(['POST', 'OPTIONS']);
  });
});

describe('/api/auth/oauth/twitter/start e2e probe', () => {
  const prevClientId = process.env.TWITTER_OAUTH_CLIENT_ID;

  beforeEach(() => {
    process.env.TWITTER_OAUTH_CLIENT_ID = 'tw-client-id';
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.TWITTER_OAUTH_CLIENT_ID = prevClientId;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(OAUTH_TWITTER_START_PATH);
    expect(src).toContain('api/auth/oauth/twitter/start/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await oauthTwitterStartRoute(startRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('POST returns authorize url when configured', async () => {
    const res = await oauthTwitterStartRoute(startRequest({ method: 'POST', body: '{}' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; url: string };
    expect(body.ok).toBe(true);
    expect(body.url).toContain('twitter.com/i/oauth2/authorize');
    expect(body.url).toContain('client_id=tw-client-id');
  });

  it('POST returns 501 when not configured', async () => {
    delete process.env.TWITTER_OAUTH_CLIENT_ID;
    const res = await oauthTwitterStartRoute(startRequest({ method: 'POST', body: '{}' }));
    expect(res.status).toBe(501);
  });

  it('GET returns 405', async () => {
    const res = await oauthTwitterStartRoute(startRequest({ method: 'GET' }));
    expect(res.status).toBe(405);
  });
});