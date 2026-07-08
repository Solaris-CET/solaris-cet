// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CETUIA_TOKENS_PATH,
  CETUIA_TOKENS_PROBE,
  demoStatusForTokenId,
  parseCetuiaTokenIdsParam,
} from '../../api/lib/cetuiaTokens';

const tokenMocks = vi.hoisted(() => ({
  rows: [
    { id: 1, status: 'available', ownerWalletAddress: null },
    { id: 17, status: 'sold', ownerWalletAddress: 'EQabc' },
  ],
  throwOnSelect: false,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from() {
          return {
            where() {
              return {
                orderBy: async () => {
                  if (tokenMocks.throwOnSelect) throw new Error('db down');
                  return tokenMocks.rows;
                },
              };
            },
            orderBy() {
              return {
                limit: async () => {
                  if (tokenMocks.throwOnSelect) throw new Error('db down');
                  return tokenMocks.rows;
                },
              };
            },
          };
        },
      };
    },
  }),
  schema: {
    cetuiaTokens: { id: 'cetuiaTokens.id', status: 'cetuiaTokens.status' },
  },
}));

import cetuiaTokensRoute, { CETUIA_TOKENS_PROBE as routeProbe } from '../../api/cetuia/tokens/route';

function tokensRequest(query = '', init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${CETUIA_TOKENS_PATH}${query}`, { ...init, headers });
}

describe('cetuiaTokens helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(CETUIA_TOKENS_PROBE.path).toBe('/api/cetuia/tokens');
    expect(routeProbe.totalTokens).toBe(9000);
    expect(routeProbe.authRequired).toBe(false);
  });

  it('parseCetuiaTokenIdsParam filters valid ids', () => {
    expect(parseCetuiaTokenIdsParam('1, 17, bad, 99999')).toEqual([1, 17]);
  });

  it('demoStatusForTokenId applies modulo rules', () => {
    expect(demoStatusForTokenId(17)).toBe('sold');
    expect(demoStatusForTokenId(11)).toBe('reserved');
    expect(demoStatusForTokenId(2)).toBe('available');
  });
});

describe('/api/cetuia/tokens e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenMocks.throwOnSelect = false;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(CETUIA_TOKENS_PATH);
    expect(src).toContain('api/cetuia/tokens/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await cetuiaTokensRoute(tokensRequest('', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET without ids returns empty source', async () => {
    const res = await cetuiaTokensRoute(tokensRequest('', { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { tokens: unknown[]; source: string };
    expect(body.tokens).toEqual([]);
    expect(body.source).toBe('empty');
  });

  it('GET with ids returns db tokens', async () => {
    const res = await cetuiaTokensRoute(tokensRequest('?ids=1,17', { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { tokens: Array<{ id: number }>; source: string };
    expect(body.source).toBe('db');
    expect(body.tokens).toHaveLength(2);
  });

  it('GET falls back to demo on db error', async () => {
    tokenMocks.throwOnSelect = true;
    const res = await cetuiaTokensRoute(tokensRequest('?ids=1', { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { source: string; tokens: Array<{ id: number }> };
    expect(body.source).toBe('demo');
    expect(body.tokens[0]?.id).toBe(1);
  });
});