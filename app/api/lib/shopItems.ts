export const SHOP_ITEMS_PATH = '/api/gamification/shop/items';
export const SHOP_ITEMS_METHODS = 'GET, OPTIONS';

export const SHOP_ITEMS_PROBE = {
  path: SHOP_ITEMS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  listLimit: 200,
};