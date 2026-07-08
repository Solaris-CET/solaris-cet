// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CONSOLE_API_KEYS_PATH,
  CONSOLE_API_KEYS_PROBE,
  consoleApiKeyCreateSchema,
  parseConsoleApiKeysDeleteId,
} from '../../api/lib/consoleApiKeys';

const keyMocks = vi.hoisted(() => ({
  authOk: true,
  keys: [{ id: 'key-1', name: 'Primary', prefix: 'sc_live_' }],
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!keyMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return { user: { id: 'user-1', walletAddress: 'EQabc', role: 'user' }, sid: 'sess-1', mfaEnabled: false };
  },
}));

vi.mock('../../api/lib/publicApiRateLimit', () => ({
  decideRateLimit: () => ({ ok: true, limit: 120, remaining: 119, resetAtEpochSeconds: 1735689600 }),
  rateLimitHeaders: () => ({
    'X-RateLimit-Limit': '120',
    'X-RateLimit-Remaining': '119',
    'X-RateLimit-Reset': '1735689600',
  }),
}));

vi.mock('../../api/lib/publicApiStore', () => ({
  listApiKeys: async () => keyMocks.keys,
  createApiKey: async () => ({ apiKey: { id: 'key-new', name: 'New key', prefix: 'sc_live_' }, rawKey: 'sc_live_secret' }),
  rotateApiKey: async () => ({ apiKey: { id: 'key-1', name: 'Primary', prefix: 'sc_live_' }, rawKey: 'sc_live_rotated' }),
  revokeApiKey: async () => true,
}));

import consoleApiKeysRoute, { CONSOLE_API_KEYS_PROBE as routeProbe } from '../../api/console/api-keys/route';

function apiKeysRequest(query = '', init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${CONSOLE_API_KEYS_PATH}${query}`, { ...init, headers });
}

describe('consoleApiKeys helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(CONSOLE_API_KEYS_PROBE.path).toBe('/api/console/api-keys');
    expect(routeProbe.rateLimitBucket).toBe('console-api-keys');
    expect(routeProbe.methods).toContain('POST');
  });

  it('consoleApiKeyCreateSchema validates name', () => {
    expect(consoleApiKeyCreateSchema.safeParse({ name: 'ab' }).success).toBe(true);
    expect(consoleApiKeyCreateSchema.safeParse({ name: 'x' }).success).toBe(false);
  });

  it('parseConsoleApiKeysDeleteId reads id param', () => {
    expect(parseConsoleApiKeysDeleteId(new URLSearchParams('id=key-1'))).toBe('key-1');
  });
});

describe('/api/console/api-keys e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    keyMocks.authOk = true;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(CONSOLE_API_KEYS_PATH);
    expect(src).toContain('api/console/api-keys/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await consoleApiKeysRoute(apiKeysRequest('', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET without auth returns 401', async () => {
    keyMocks.authOk = false;
    const res = await consoleApiKeysRoute(apiKeysRequest('', { method: 'GET' }));
    expect(res.status).toBe(401);
  });

  it('GET lists api keys', async () => {
    const res = await consoleApiKeysRoute(
      apiKeysRequest('', { method: 'GET', headers: { Authorization: 'Bearer valid-token' } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { keys: Array<{ id: string }> };
    expect(body.keys).toHaveLength(1);
  });

  it('POST creates api key', async () => {
    const res = await consoleApiKeysRoute(
      apiKeysRequest('', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ name: 'Integration' }),
      }),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { rawKey: string };
    expect(body.rawKey).toBe('sc_live_secret');
  });

  it('DELETE revokes api key', async () => {
    const res = await consoleApiKeysRoute(
      apiKeysRequest('?id=key-1', { method: 'DELETE', headers: { Authorization: 'Bearer valid-token' } }),
    );
    expect(res.status).toBe(204);
  });
});