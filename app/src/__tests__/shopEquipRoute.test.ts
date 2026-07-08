// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { parseShopEquipItemSlug, SHOP_EQUIP_PATH, SHOP_EQUIP_PROBE } from '../../api/lib/shopEquip';

const equipMocks = vi.hoisted(() => {
  const schema = {
    shopItems: { id: 'shopItems.id', slug: 'shopItems.slug', active: 'shopItems.active' },
    userInventory: { id: 'userInventory.id', userId: 'userInventory.userId', itemId: 'userInventory.itemId', equipped: 'userInventory.equipped' },
  };

  const bag = {
    authOk: true,
    itemFound: true,
    owned: true,
    transactionCalled: false,
    unequipCalled: false,
    equipCalled: false,
  };

  const makeTx = () => ({
    update() {
      return {
        set(fields: { equipped?: boolean }) {
          return {
            where: async () => {
              if (fields.equipped === false) bag.unequipCalled = true;
              if (fields.equipped === true) bag.equipCalled = true;
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
          if (table === schema.shopItems) {
            return {
              where() {
                return {
                  limit: async () => (bag.itemFound ? [{ id: 'item-1' }] : []),
                };
              },
            };
          }
          if (table === schema.userInventory) {
            return {
              where() {
                return {
                  limit: async () => (bag.owned ? [{ id: 'inv-1' }] : []),
                };
              },
            };
          }
          return { where: () => ({ limit: async () => [] }) };
        },
      };
    },
    transaction: async (fn: (tx: ReturnType<typeof makeTx>) => Promise<void>) => {
      bag.transactionCalled = true;
      await fn(makeTx());
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
    if (!equipMocks.authOk || !auth.startsWith('Bearer valid-token')) return null;
    return { id: 'user-1', walletAddress: 'EQabc', role: 'user' };
  },
}));

vi.mock('../../db/client', () => ({
  getDb: equipMocks.getDb,
  schema: equipMocks.schema,
}));

import shopEquipRoute, { SHOP_EQUIP_PROBE as routeProbe } from '../../api/gamification/shop/equip/route';

function equipRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${SHOP_EQUIP_PATH}`, { ...init, headers });
}

describe('shopEquip helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SHOP_EQUIP_PROBE.path).toBe('/api/gamification/shop/equip');
    expect(routeProbe.authRequired).toBe(true);
  });

  it('parseShopEquipItemSlug trims slug', () => {
    expect(parseShopEquipItemSlug({ itemSlug: '  solar-frame  ' })).toBe('solar-frame');
  });
});

describe('/api/gamification/shop/equip e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    equipMocks.authOk = true;
    equipMocks.itemFound = true;
    equipMocks.owned = true;
    equipMocks.transactionCalled = false;
    equipMocks.unequipCalled = false;
    equipMocks.equipCalled = false;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SHOP_EQUIP_PATH);
    expect(src).toContain('api/gamification/shop/equip/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await shopEquipRoute(equipRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('POST equips owned item', async () => {
    const res = await shopEquipRoute(
      equipRequest({
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ itemSlug: 'solar-frame' }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; equipped: string };
    expect(body.ok).toBe(true);
    expect(body.equipped).toBe('solar-frame');
    expect(equipMocks.transactionCalled).toBe(true);
    expect(equipMocks.unequipCalled).toBe(true);
    expect(equipMocks.equipCalled).toBe(true);
  });

  it('POST without owned item returns 409', async () => {
    equipMocks.owned = false;
    const res = await shopEquipRoute(
      equipRequest({
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ itemSlug: 'solar-frame' }),
      }),
    );
    expect(res.status).toBe(409);
  });
});