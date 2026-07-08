// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SHOP_INVENTORY_PATH, SHOP_INVENTORY_PROBE } from '../../api/lib/shopInventory';

const inventoryMocks = vi.hoisted(() => {
  const schema = {
    userInventory: { userId: 'userInventory.userId', itemId: 'userInventory.itemId', equipped: 'userInventory.equipped', acquiredAt: 'userInventory.acquiredAt' },
    shopItems: { id: 'shopItems.id', slug: 'shopItems.slug', title: 'shopItems.title', description: 'shopItems.description', kind: 'shopItems.kind', meta: 'shopItems.meta', active: 'shopItems.active' },
  };

  const bag = {
    authOk: true,
    items: [
      {
        slug: 'solar-frame',
        title: 'Solar Frame',
        description: 'Golden frame',
        kind: 'frame',
        meta: { color: 'gold' },
        equipped: true,
        acquiredAt: new Date('2026-07-01T10:00:00Z'),
      },
    ],
  };

  const getDb = () => ({
    select() {
      return {
        from(table: unknown) {
          if (table === schema.userInventory) {
            return {
              innerJoin() {
                return {
                  where() {
                    return {
                      orderBy() {
                        return {
                          limit: async () => bag.items,
                        };
                      },
                    };
                  },
                };
              },
            };
          }
          return { where: () => ({ limit: async () => [] }) };
        },
      };
    },
  });

  return Object.assign(bag, { schema, getDb });
});

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/authUser', () => ({
  requireUser: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!inventoryMocks.authOk || !auth.startsWith('Bearer valid-token')) return null;
    return { id: 'user-1', walletAddress: 'EQabc', role: 'user' };
  },
}));

vi.mock('../../db/client', () => ({
  getDb: inventoryMocks.getDb,
  schema: inventoryMocks.schema,
}));

import shopInventoryRoute, { SHOP_INVENTORY_PROBE as routeProbe } from '../../api/gamification/shop/inventory/route';

function inventoryRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${SHOP_INVENTORY_PATH}`, { ...init, headers });
}

describe('shopInventory helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SHOP_INVENTORY_PROBE.path).toBe('/api/gamification/shop/inventory');
    expect(routeProbe.listLimit).toBe(200);
  });
});

describe('/api/gamification/shop/inventory e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inventoryMocks.authOk = true;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SHOP_INVENTORY_PATH);
    expect(src).toContain('api/gamification/shop/inventory/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await shopInventoryRoute(inventoryRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET without auth returns 401', async () => {
    inventoryMocks.authOk = false;
    const res = await shopInventoryRoute(inventoryRequest({ method: 'GET' }));
    expect(res.status).toBe(401);
  });

  it('GET returns shop inventory', async () => {
    const res = await shopInventoryRoute(
      inventoryRequest({ method: 'GET', headers: { Authorization: 'Bearer valid-token' } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; inventory: Array<{ slug: string; equipped: boolean }> };
    expect(body.ok).toBe(true);
    expect(body.inventory).toHaveLength(1);
    expect(body.inventory[0]?.slug).toBe('solar-frame');
    expect(body.inventory[0]?.equipped).toBe(true);
  });
});