// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rollWheelReward, WHEEL_SPIN_PATH, WHEEL_SPIN_PROBE } from '../../api/lib/wheelSpin';

const spinMocks = vi.hoisted(() => {
  const schema = {
    wheelSpins: {
      userId: 'wheelSpins.userId',
      day: 'wheelSpins.day',
      rewardPoints: 'wheelSpins.rewardPoints',
      createdAt: 'wheelSpins.createdAt',
    },
  };

  const bag = {
    authOk: true,
    existingSpin: null as { rewardPoints: number; createdAt: Date } | null,
    inserted: false,
  };

  const makeTx = () => ({
    insert() {
      return {
        values() {
          return {
            returning: async () => {
              bag.inserted = true;
              return [{ createdAt: new Date('2026-07-07T10:00:00Z') }];
            },
          };
        },
      };
    },
    select() {
      return {
        from() {
          return {
            where() {
              return {
                limit: async () => (bag.existingSpin ? [bag.existingSpin] : []),
              };
            },
          };
        },
      };
    },
  });

  const getDb = () => ({
    select() {
      return {
        from(table: unknown) {
          if (table === schema.wheelSpins) {
            return {
              where() {
                return {
                  limit: async () => (bag.existingSpin ? [bag.existingSpin] : []),
                };
              },
            };
          }
          return { where: () => ({ limit: async () => [] }) };
        },
      };
    },
    transaction: async (fn: (tx: ReturnType<typeof makeTx>) => Promise<unknown>) => fn(makeTx()),
  });

  return Object.assign(bag, { schema, getDb });
});

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/authUser', () => ({
  requireUser: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!spinMocks.authOk || !auth.startsWith('Bearer valid-token')) return null;
    return { id: 'user-1', walletAddress: 'EQabc', role: 'user' };
  },
}));

vi.mock('../../api/lib/points', () => ({
  awardPoints: async () => ({ awarded: true }),
}));

vi.mock('../../api/gamification/lib/gamification', () => ({
  todayKeyUtc: () => '2026-07-07',
}));

vi.mock('../../api/lib/wheelSpin', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/lib/wheelSpin')>();
  return {
    ...actual,
    rollWheelReward: () => 5,
  };
});

vi.mock('../../db/client', () => ({
  getDb: spinMocks.getDb,
  schema: spinMocks.schema,
}));

import wheelSpinRoute, { WHEEL_SPIN_PROBE as routeProbe } from '../../api/gamification/wheel/spin/route';

function spinRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${WHEEL_SPIN_PATH}`, { ...init, headers });
}

describe('wheelSpin helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(WHEEL_SPIN_PROBE.path).toBe('/api/gamification/wheel/spin');
    expect(routeProbe.wheelReason).toBe('wheel');
  });

  it('rollWheelReward returns bucket value', async () => {
    const { rollWheelReward: rollActual } = await vi.importActual<typeof import('../../api/lib/wheelSpin')>(
      '../../api/lib/wheelSpin',
    );
    expect(rollActual(() => 0)).toBe(0);
    expect(rollActual(() => 99)).toBe(10);
    expect(rollWheelReward()).toBe(5);
  });
});

describe('/api/gamification/wheel/spin e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    spinMocks.authOk = true;
    spinMocks.existingSpin = null;
    spinMocks.inserted = false;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(WHEEL_SPIN_PATH);
    expect(src).toContain('api/gamification/wheel/spin/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await wheelSpinRoute(spinRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('POST spins wheel for reward', async () => {
    const res = await wheelSpinRoute(
      spinRequest({ method: 'POST', headers: { Authorization: 'Bearer valid-token' } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; spun: boolean; rewardPoints: number; awarded: boolean };
    expect(body.ok).toBe(true);
    expect(body.spun).toBe(true);
    expect(body.rewardPoints).toBe(5);
    expect(body.awarded).toBe(true);
    expect(spinMocks.inserted).toBe(true);
  });

  it('POST returns existing spin for day', async () => {
    spinMocks.existingSpin = { rewardPoints: 3, createdAt: new Date('2026-07-07T08:00:00Z') };
    const res = await wheelSpinRoute(
      spinRequest({ method: 'POST', headers: { Authorization: 'Bearer valid-token' } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { rewardPoints: number };
    expect(body.rewardPoints).toBe(3);
    expect(spinMocks.inserted).toBe(false);
  });
});