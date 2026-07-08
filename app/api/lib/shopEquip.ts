export const SHOP_EQUIP_PATH = '/api/gamification/shop/equip';
export const SHOP_EQUIP_METHODS = 'POST, OPTIONS';

export const SHOP_EQUIP_PROBE = {
  path: SHOP_EQUIP_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  invalidItemError: 'Invalid item' as const,
  notFoundError: 'Item not found' as const,
  notOwnedError: 'Not owned' as const,
};

export function parseShopEquipItemSlug(body: unknown): string {
  return typeof (body as { itemSlug?: unknown })?.itemSlug === 'string' ? (body as { itemSlug: string }).itemSlug.trim() : '';
}