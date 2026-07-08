// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SHOP_ITEMS_PATH, SHOP_ITEMS_PROBE } from '../../api/lib/shopItems';

const itemsMocks = vi.hoisted(() => {
  const schema = {
    shopItems: { slug: 'shopItems.slug', active: 'shopItems.active', costPoints: 'shopItems.costPoints' },
  };

  const bag = {
    items: [
      {
        slug: 'solar-frame',
        title: 'Solar Frame',
        description: 'Golden frame',
        kind: 'frame',
        costPoints: 50,
        meta: { color: 'gold' },
      },
    ],
  };

  const getDb = () => ({
    select() {
      return {
        from(table: unknown) {
          if (table === schema.shopItems) {
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

vi.mock('../../api/gamification/lib/gamification', () => ({
  bootstrapGamification: async () => undefined,
}));

vi.mock('../../db/client', () => ({
  getDb: itemsMocks.getDb,
  schema: itemsMocks.schema,
}));

import shopItemsRoute, { SHOP_ITEMS_PROBE as routeProbe } from '../../api/gamification/shop/items/route';

function itemsRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${SHOP_ITEMS_PATH}`, { ...init, headers });
}

describe('shopItems helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SHOP_ITEMS_PROBE.path).toBe('/api/gamification/shop/items');
    expect(routeProbe.authRequired).toBe(false);
    expect(routeProbe.listLimit).toBe(200);
  });
});

describe('/api/gamification/shop/items e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SHOP_ITEMS_PATH);
    expect(src).toContain('api/gamification/shop/items/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await shopItemsRoute(itemsRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET returns active shop items', async () => {
    const res = await shopItemsRoute(itemsRequest({ method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; items: Array<{ slug: string }> };
    expect(body.ok).toBe(true);
    expect(body.items[0]?.slug).toBe('solar-frame');
  });
});