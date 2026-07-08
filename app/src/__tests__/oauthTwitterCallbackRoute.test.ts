// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { OAUTH_TWITTER_CALLBACK_PATH, OAUTH_TWITTER_CALLBACK_PROBE } from '../../api/lib/oauthTwitterCallback';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import oauthTwitterCallbackRoute, { OAUTH_TWITTER_CALLBACK_PROBE as routeProbe } from '../../api/auth/oauth/twitter/callback/route';

describe('oauthTwitterCallback helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(OAUTH_TWITTER_CALLBACK_PROBE.path).toBe('/api/auth/oauth/twitter/callback');
    expect(routeProbe.provider).toBe('twitter');
    expect(routeProbe.methods).toEqual(['GET']);
  });
});

describe('/api/auth/oauth/twitter/callback e2e probe', () => {
  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(OAUTH_TWITTER_CALLBACK_PATH);
    expect(src).toContain('api/auth/oauth/twitter/callback/route.js');
  });

  it('GET redirects on oauth error param', async () => {
    const res = await oauthTwitterCallbackRoute(
      new Request(`http://test${OAUTH_TWITTER_CALLBACK_PATH}?error=denied`, {
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toContain('oauth_error=denied');
  });

  it('GET redirects when state or code missing', async () => {
    const res = await oauthTwitterCallbackRoute(
      new Request(`http://test${OAUTH_TWITTER_CALLBACK_PATH}`, {
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toContain('oauth_error=invalid');
  });
});