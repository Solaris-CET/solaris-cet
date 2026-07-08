export const SHOP_INVENTORY_PATH = '/api/gamification/shop/inventory';
export const SHOP_INVENTORY_METHODS = 'GET, OPTIONS';

export const SHOP_INVENTORY_PROBE = {
  path: SHOP_INVENTORY_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  listLimit: 200,
};