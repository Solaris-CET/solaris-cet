// @vitest-environment node
import { authRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ALERTS_PATH,
  ALERTS_PROBE,
  parseAlertDeleteId,
  parseAlertPostBody,
  parseAlertTargetUsd,
} from '../../api/lib/alerts';

const alertsMocks = vi.hoisted(() => ({
  authOk: true,
  alerts: [
    {
      id: 'alert-1',
      userId: 'user-1',
      asset: 'CET',
      direction: 'above',
      targetUsd: '1.5',
      channel: 'email',
      cooldownMinutes: 60,
      lastSentAt: null as Date | null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    },
  ],
  insertedId: 'alert-new',
  deleted: false,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/authUser', () => ({
  requireUser: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!alertsMocks.authOk || !auth.startsWith('Bearer valid-token')) return null;
    return { id: 'user-1', walletAddress: 'EQabc', role: 'user' };
  },
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from() {
          return {
            where: async () => alertsMocks.alerts,
          };
        },
      };
    },
    insert() {
      return {
        values() {
          return {
            returning: async () => [{ id: alertsMocks.insertedId }],
          };
        },
      };
    },
    update() {
      return {
        set() {
          return {
            where() {
              return {
                returning: async () => [],
              };
            },
          };
        },
      };
    },
    delete() {
      return {
        where: async () => {
          alertsMocks.deleted = true;
        },
      };
    },
  }),
  schema: {
    priceAlerts: {
      id: 'priceAlerts.id',
      userId: 'priceAlerts.userId',
      asset: 'priceAlerts.asset',
      direction: 'priceAlerts.direction',
      targetUsd: 'priceAlerts.targetUsd',
      channel: 'priceAlerts.channel',
      cooldownMinutes: 'priceAlerts.cooldownMinutes',
      lastSentAt: 'priceAlerts.lastSentAt',
      createdAt: 'priceAlerts.createdAt',
    },
  },
}));

import alertsRoute, { ALERTS_PROBE as routeProbe } from '../../api/alerts/route';

describe('alerts helpers', () => {
  it('parseAlertPostBody validates direction and target', () => {
    expect(parseAlertPostBody({ direction: 'above', targetUsd: '2.5' })).toEqual({
      id: null,
      asset: 'CET',
      direction: 'above',
      targetUsd: '2.5',
      channel: 'email',
      cooldownMinutes: 60,
    });
    expect(parseAlertPostBody({ direction: 'sideways', targetUsd: '1' })).toBeNull();
    expect(parseAlertTargetUsd('-1')).toBeNull();
  });

  it('parseAlertDeleteId trims id', () => {
    expect(parseAlertDeleteId(new URLSearchParams('id= alert-9 '))).toBe('alert-9');
  });

  it('exports stable e2e probe contract', () => {
    expect(ALERTS_PROBE.path).toBe('/api/alerts');
    expect(routeProbe.authRequired).toBe(true);
    expect(routeProbe.methods).toEqual(['GET', 'POST', 'DELETE', 'OPTIONS']);
  });
});

describe('/api/alerts e2e probe', () => {
  beforeEach(() => {
    alertsMocks.authOk = true;
    alertsMocks.deleted = false;
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ALERTS_PATH);
    expect(src).toContain('api/alerts/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await alertsRoute(authRequest(ALERTS_PATH, { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('DELETE');
  });

  it('GET requires auth', async () => {
    alertsMocks.authOk = false;
    const res = await alertsRoute(authRequest(ALERTS_PATH, { method: 'GET' }));
    expect(res.status).toBe(ALERTS_PROBE.unauthenticatedStatus);
  });

  it('GET returns alerts list', async () => {
    const res = await alertsRoute(authRequest(ALERTS_PATH, { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; alerts: Array<{ id: string; asset: string }> };
    expect(body.ok).toBe(true);
    expect(body.alerts[0]?.id).toBe('alert-1');
    expect(body.alerts[0]?.asset).toBe('CET');
  });

  it('POST creates alert', async () => {
    const res = await alertsRoute(
      authRequest(ALERTS_PATH, {
        method: 'POST',
        body: JSON.stringify({ direction: 'below', targetUsd: '0.9', channel: 'push' }),
      }),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { ok: boolean; alert: { id: string } };
    expect(body.ok).toBe(true);
    expect(body.alert.id).toBe('alert-new');
  });

  it('DELETE removes alert', async () => {
    const res = await alertsRoute(authRequest(`${ALERTS_PATH}?id=alert-1`, { method: 'DELETE' }));
    expect(res.status).toBe(200);
    expect(alertsMocks.deleted).toBe(true);
  });

  it('DELETE requires id', async () => {
    const res = await alertsRoute(authRequest(ALERTS_PATH, { method: 'DELETE' }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(ALERTS_PROBE.missingIdError);
  });
});