// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { isShopBuyUniqueViolation, parseShopBuyItemSlug, SHOP_BUY_PATH, SHOP_BUY_PROBE } from '../../api/lib/shopBuy';

const buyMocks = vi.hoisted(() => {
  const schema = {
    shopItems: { id: 'shopItems.id', slug: 'shopItems.slug', costPoints: 'shopItems.costPoints', active: 'shopItems.active' },
    userInventory: { id: 'userInventory.id', userId: 'userInventory.userId', itemId: 'userInventory.itemId' },
    pointsLedger: { userId: 'pointsLedger.userId' },
    users: { id: 'users.id', points: 'users.points' },
  };

  const bag = {
    authOk: true,
    itemFound: true,
    alreadyOwned: false,
    insufficientPoints: false,
    inventoryInserted: false,
  };

  const makeTx = () => ({
    select() {
      return {
        from(table: unknown) {
          if (table === schema.shopItems) {
            return {
              where() {
                return {
                  limit: async () =>
                    bag.itemFound ? [{ id: 'item-1', slug: 'solar-frame', cost: 50, active: true }] : [],
                };
              },
            };
          }
          if (table === schema.userInventory) {
            return {
              where() {
                return {
                  limit: async () => (bag.alreadyOwned ? [{ id: 'inv-1' }] : []),
                };
              },
            };
          }
          return { where: () => ({ limit: async () => [] }) };
        },
      };
    },
    insert(table: unknown) {
      return {
        values: async () => {
          if (table === schema.userInventory) bag.inventoryInserted = true;
        },
      };
    },
    update() {
      return {
        set() {
          return {
            where() {
              return {
                returning: async () => (bag.insufficientPoints ? [] : [{ points: 450 }]),
              };
            },
          };
        },
      };
    },
  });

  const getDb = () => ({
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
    if (!buyMocks.authOk || !auth.startsWith('Bearer valid-token')) return null;
    return { id: 'user-1', walletAddress: 'EQabc', role: 'user' };
  },
}));

vi.mock('../../api/gamification/lib/gamification', () => ({
  bootstrapGamification: async () => undefined,
}));

vi.mock('../../db/client', () => ({
  getDb: buyMocks.getDb,
  schema: buyMocks.schema,
}));

import shopBuyRoute, { SHOP_BUY_PROBE as routeProbe } from '../../api/gamification/shop/buy/route';

function buyRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${SHOP_BUY_PATH}`, { ...init, headers });
}

describe('shopBuy helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SHOP_BUY_PROBE.path).toBe('/api/gamification/shop/buy');
    expect(routeProbe.shopReason).toBe('shop');
  });

  it('parseShopBuyItemSlug and isShopBuyUniqueViolation', () => {
    expect(parseShopBuyItemSlug({ itemSlug: '  solar-frame  ' })).toBe('solar-frame');
    expect(isShopBuyUniqueViolation({ code: '23505' })).toBe(true);
    expect(isShopBuyUniqueViolation({ code: '99999' })).toBe(false);
  });
});

describe('/api/gamification/shop/buy e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buyMocks.authOk = true;
    buyMocks.itemFound = true;
    buyMocks.alreadyOwned = false;
    buyMocks.insufficientPoints = false;
    buyMocks.inventoryInserted = false;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SHOP_BUY_PATH);
    expect(src).toContain('api/gamification/shop/buy/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await shopBuyRoute(buyRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('POST purchases shop item', async () => {
    const res = await shopBuyRoute(
      buyRequest({
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ itemSlug: 'solar-frame' }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; purchased: boolean; cost: number };
    expect(body.ok).toBe(true);
    expect(body.purchased).toBe(true);
    expect(body.cost).toBe(50);
    expect(buyMocks.inventoryInserted).toBe(true);
  });

  it('POST with insufficient points returns 409', async () => {
    buyMocks.insufficientPoints = true;
    const res = await shopBuyRoute(
      buyRequest({
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ itemSlug: 'solar-frame' }),
      }),
    );
    expect(res.status).toBe(409);
  });
});