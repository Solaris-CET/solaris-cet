// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildWeb3IntentsListResponse,
  mapWeb3IntentRow,
  parseWeb3IntentCreateBody,
  parseWeb3IntentType,
  WEB3_INTENTS_PATH,
  WEB3_INTENTS_PROBE,
} from '../../api/lib/web3Intents';

const intentMocks = vi.hoisted(() => ({
  authOk: true,
  insertedId: 'intent-1',
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/authUser', () => ({
  requireUser: async (req: Request) => {
    if (!intentMocks.authOk || !req.headers.get('Authorization')?.startsWith('Bearer ')) return null;
    return { id: 'user-1', walletAddress: 'EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX', role: 'user' };
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
                    limit: async () => [
                      {
                        id: 'intent-1',
                        type: 'stake',
                        status: 'created',
                        txHash: null,
                        providerRef: null,
                        meta: null,
                        createdAt: new Date('2026-07-07T12:00:00.000Z'),
                      },
                    ],
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
            returning: async () => [{ id: intentMocks.insertedId }],
          };
        },
      };
    },
  }),
  schema: {
    web3Intents: { userId: 'web3Intents.userId' },
  },
}));

import web3IntentsRoute, { WEB3_INTENTS_PROBE as routeProbe } from '../../api/web3/intents/route';

function intentsRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('Authorization', 'Bearer valid-token');
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${WEB3_INTENTS_PATH}`, { ...init, headers });
}

describe('web3Intents helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(WEB3_INTENTS_PROBE.path).toBe('/api/web3/intents');
    expect(routeProbe.listLimit).toBe(50);
  });

  it('parseWeb3IntentType accepts known types', () => {
    expect(parseWeb3IntentType('stake')).toBe('stake');
    expect(parseWeb3IntentType('unknown')).toBeNull();
    expect(parseWeb3IntentCreateBody({ type: 'bridge', txHash: 'abc' })?.type).toBe('bridge');
  });

  it('mapWeb3IntentRow serializes createdAt', () => {
    const item = mapWeb3IntentRow({
      id: 'i1',
      type: 'vote',
      status: 'pending',
      txHash: 'hash',
      providerRef: 'ref',
      meta: { k: 1 },
      createdAt: new Date('2026-07-07T12:00:00.000Z'),
    });
    expect(item.createdAt).toBe('2026-07-07T12:00:00.000Z');
    expect(buildWeb3IntentsListResponse([item]).intents).toHaveLength(1);
  });
});

describe('/api/web3/intents e2e probe', () => {
  beforeEach(() => {
    intentMocks.authOk = true;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(WEB3_INTENTS_PATH);
    expect(src).toContain('api/web3/intents/route.js');
  });

  it('GET returns intents for authenticated user', async () => {
    const res = await web3IntentsRoute(intentsRequest({ method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; intents: Array<{ id: string; type: string }> };
    expect(body.ok).toBe(true);
    expect(body.intents[0]?.id).toBe('intent-1');
  });

  it('POST creates intent', async () => {
    const res = await web3IntentsRoute(
      intentsRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'stake' }),
      }),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { ok: boolean; id: string };
    expect(body.ok).toBe(true);
    expect(body.id).toBe('intent-1');
  });

  it('POST without auth returns 401', async () => {
    intentMocks.authOk = false;
    const res = await web3IntentsRoute(
      intentsRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'stake' }),
      }),
    );
    expect(res.status).toBe(401);
  });
});