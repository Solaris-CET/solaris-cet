// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { parseOAuthCallbackParams, safeOAuthRedirect } from '../../api/lib/oauthCommon';
import { OAUTH_GITHUB_CALLBACK_PATH, OAUTH_GITHUB_CALLBACK_PROBE } from '../../api/lib/oauthGitHubCallback';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import oauthGitHubCallbackRoute, { OAUTH_GITHUB_CALLBACK_PROBE as routeProbe } from '../../api/auth/oauth/github/callback/route';

describe('oauthGitHubCallback helpers', () => {
  it('parseOAuthCallbackParams reads query params', () => {
    expect(parseOAuthCallbackParams(new URLSearchParams('state=s1&code=c1'))).toEqual({
      state: 's1',
      code: 'c1',
      error: '',
    });
  });

  it('safeOAuthRedirect blocks open redirects', () => {
    expect(safeOAuthRedirect('/ok')).toBe('/ok');
    expect(safeOAuthRedirect('https://evil.test')).toBe('/login');
  });

  it('exports stable e2e probe contract', () => {
    expect(OAUTH_GITHUB_CALLBACK_PROBE.path).toBe('/api/auth/oauth/github/callback');
    expect(routeProbe.provider).toBe('github');
    expect(routeProbe.methods).toEqual(['GET']);
  });
});

describe('/api/auth/oauth/github/callback e2e probe', () => {
  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(OAUTH_GITHUB_CALLBACK_PATH);
    expect(src).toContain('api/auth/oauth/github/callback/route.js');
  });

  it('GET redirects on oauth error param', async () => {
    const res = await oauthGitHubCallbackRoute(
      new Request(`http://test${OAUTH_GITHUB_CALLBACK_PATH}?error=access_denied`, {
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toContain('oauth_error=access_denied');
  });

  it('GET redirects when state or code missing', async () => {
    const res = await oauthGitHubCallbackRoute(
      new Request(`http://test${OAUTH_GITHUB_CALLBACK_PATH}?state=only-state`, {
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toContain('oauth_error=invalid');
  });
});