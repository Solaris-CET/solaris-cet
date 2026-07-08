export const SHOP_BUY_PATH = '/api/gamification/shop/buy';
export const SHOP_BUY_METHODS = 'POST, OPTIONS';

export const SHOP_BUY_PROBE = {
  path: SHOP_BUY_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  invalidJsonError: 'Invalid JSON' as const,
  invalidItemError: 'Invalid item' as const,
  notFoundError: 'Item not found' as const,
  invalidCostError: 'Invalid item cost' as const,
  insufficientPointsError: 'Insufficient points' as const,
  shopReason: 'shop' as const,
};

export function parseShopBuyItemSlug(body: unknown): string {
  return typeof (body as { itemSlug?: unknown })?.itemSlug === 'string' ? (body as { itemSlug: string }).itemSlug.trim() : '';
}

export function isShopBuyUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === '23505';
}