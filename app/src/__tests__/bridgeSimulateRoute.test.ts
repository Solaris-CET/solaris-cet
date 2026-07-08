// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BRIDGE_SIMULATE_PATH,
  BRIDGE_SIMULATE_PROBE,
  isBridgeMeta,
  parseBridgeDirection,
  parseBridgeEvmAddress,
} from '../../api/lib/bridgeSimulate';

const VALID_WALLET = 'EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX';

const bridgeMocks = vi.hoisted(() => ({
  authOk: true,
  rows: [] as Array<{
    id: string;
    userId: string;
    type: string;
    status: string;
    meta: unknown;
    createdAt: Date;
    providerRef: string | null;
    txHash: string | null;
  }>,
  insertedId: 'intent-1',
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/authUser', () => ({
  requireUser: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!bridgeMocks.authOk || !auth.startsWith('Bearer valid-token')) return null;
    return { id: 'user-1', walletAddress: VALID_WALLET, role: 'user' };
  },
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from() {
          return {
            where() {
              return {
                orderBy() {
                  return {
                    limit: async () => bridgeMocks.rows,
                  };
                },
              };
            },
          };
        },
      };
    },
    insert() {
      return {
        values() {
          return {
            returning: async () => [{ id: bridgeMocks.insertedId }],
          };
        },
      };
    },
    update() {
      return {
        set() {
          return {
            where: async () => undefined,
          };
        },
      };
    },
  }),
  schema: {
    web3Intents: {
      id: 'web3Intents.id',
      userId: 'web3Intents.userId',
      type: 'web3Intents.type',
    },
  },
}));

import bridgeSimulateRoute, { BRIDGE_SIMULATE_PROBE as routeProbe } from '../../api/bridge/simulate/route';

function bridgeRequest(query = '', init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${BRIDGE_SIMULATE_PATH}${query}`, { ...init, headers });
}

describe('bridgeSimulate helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(BRIDGE_SIMULATE_PROBE.path).toBe('/api/bridge/simulate');
    expect(routeProbe.authRequired).toBe(true);
    expect(routeProbe.limits.minCET).toBe(0.01);
  });

  it('parseBridgeDirection accepts wrap/unwrap', () => {
    expect(parseBridgeDirection('wrap')).toBe('wrap');
    expect(parseBridgeDirection('invalid')).toBeNull();
  });

  it('parseBridgeEvmAddress validates hex address', () => {
    expect(parseBridgeEvmAddress('0x' + 'a'.repeat(40))).toBe('0x' + 'a'.repeat(40));
    expect(parseBridgeEvmAddress('bad')).toBeNull();
  });

  it('isBridgeMeta detects bridge_sim meta', () => {
    expect(
      isBridgeMeta({
        kind: 'bridge_sim',
        version: 1,
        asset: 'CET',
        direction: 'wrap',
      }),
    ).toBe(true);
    expect(isBridgeMeta({ kind: 'other' })).toBe(false);
  });
});

describe('/api/bridge/simulate e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bridgeMocks.authOk = true;
    bridgeMocks.rows = [];
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(BRIDGE_SIMULATE_PATH);
    expect(src).toContain('api/bridge/simulate/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await bridgeSimulateRoute(bridgeRequest('', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('GET without auth returns 401', async () => {
    bridgeMocks.authOk = false;
    const res = await bridgeSimulateRoute(bridgeRequest('', { method: 'GET' }));
    expect(res.status).toBe(401);
  });

  it('POST creates bridge intent', async () => {
    const res = await bridgeSimulateRoute(
      bridgeRequest('', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ direction: 'wrap', amountCET: '1.0' }),
      }),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { ok: boolean; id: string };
    expect(body.ok).toBe(true);
    expect(body.id).toBe('intent-1');
  });

  it('POST with invalid direction returns 400', async () => {
    const res = await bridgeSimulateRoute(
      bridgeRequest('', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ direction: 'bad', amountCET: '1.0' }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('GET returns transfers list', async () => {
    const res = await bridgeSimulateRoute(
      bridgeRequest('', { method: 'GET', headers: { Authorization: 'Bearer valid-token' } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; transfers: unknown[] };
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.transfers)).toBe(true);
  });
});