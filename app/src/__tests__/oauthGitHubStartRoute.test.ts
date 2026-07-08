// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OAUTH_GITHUB_START_PATH, OAUTH_GITHUB_START_PROBE } from '../../api/lib/oauthGitHubStart';
import { parseOAuthReturnTo } from '../../api/lib/oauthCommon';

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

import oauthGitHubStartRoute, { OAUTH_GITHUB_START_PROBE as routeProbe } from '../../api/auth/oauth/github/start/route';

function startRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${OAUTH_GITHUB_START_PATH}`, { ...init, headers });
}

describe('oauthGitHubStart helpers', () => {
  it('parseOAuthReturnTo defaults and trims', () => {
    expect(parseOAuthReturnTo({ returnTo: ' /account ' })).toBe('/account');
    expect(parseOAuthReturnTo(null)).toBe('/login');
  });

  it('exports stable e2e probe contract', () => {
    expect(OAUTH_GITHUB_START_PROBE.path).toBe('/api/auth/oauth/github/start');
    expect(routeProbe.provider).toBe('github');
    expect(routeProbe.methods).toEqual(['POST', 'OPTIONS']);
  });
});

describe('/api/auth/oauth/github/start e2e probe', () => {
  const prevClientId = process.env.GITHUB_OAUTH_CLIENT_ID;

  beforeEach(() => {
    process.env.GITHUB_OAUTH_CLIENT_ID = 'gh-client-id';
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.GITHUB_OAUTH_CLIENT_ID = prevClientId;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(OAUTH_GITHUB_START_PATH);
    expect(src).toContain('api/auth/oauth/github/start/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await oauthGitHubStartRoute(startRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('POST returns authorize url when configured', async () => {
    const res = await oauthGitHubStartRoute(
      startRequest({ method: 'POST', body: JSON.stringify({ returnTo: '/account' }) }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; url: string };
    expect(body.ok).toBe(true);
    expect(body.url).toContain('github.com/login/oauth/authorize');
    expect(body.url).toContain('client_id=gh-client-id');
  });

  it('POST returns 501 when not configured', async () => {
    delete process.env.GITHUB_OAUTH_CLIENT_ID;
    const res = await oauthGitHubStartRoute(startRequest({ method: 'POST', body: '{}' }));
    expect(res.status).toBe(501);
  });

  it('GET returns 405', async () => {
    const res = await oauthGitHubStartRoute(startRequest({ method: 'GET' }));
    expect(res.status).toBe(405);
  });
});