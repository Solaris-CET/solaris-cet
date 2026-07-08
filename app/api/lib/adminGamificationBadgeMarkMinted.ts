export const ADMIN_GAMIFICATION_BADGE_MARK_MINTED_PATH = '/api/admin/gamification/badges/mark-minted';
export const ADMIN_GAMIFICATION_BADGE_MARK_MINTED_METHODS = 'POST, OPTIONS';

export const ADMIN_GAMIFICATION_BADGE_MARK_MINTED_PROBE = {
  path: ADMIN_GAMIFICATION_BADGE_MARK_MINTED_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  minRole: 'editor' as const,
  unauthenticatedStatus: 401,
  rateLimitKey: 'admin-badge-mint',
  auditAction: 'BADGE_MARK_MINTED' as const,
  maxTxHashLength: 200,
  maxNftAddressLength: 120,
};

export type BadgeMarkMintedBody =
  | { ok: true; userId: string; badgeSlug: string; txHash: string; nftAddress: string }
  | { ok: false; error: 'Invalid request' };

export function parseBadgeMarkMintedBody(body: unknown): BadgeMarkMintedBody {
  const userId =
    typeof (body as { userId?: unknown })?.userId === 'string'
      ? (body as { userId: string }).userId.trim()
      : '';
  const badgeSlug =
    typeof (body as { badgeSlug?: unknown })?.badgeSlug === 'string'
      ? (body as { badgeSlug: string }).badgeSlug.trim()
      : '';
  const txHash =
    typeof (body as { txHash?: unknown })?.txHash === 'string'
      ? (body as { txHash: string }).txHash.trim().slice(0, ADMIN_GAMIFICATION_BADGE_MARK_MINTED_PROBE.maxTxHashLength)
      : '';
  const nftAddress =
    typeof (body as { nftAddress?: unknown })?.nftAddress === 'string'
      ? (body as { nftAddress: string }).nftAddress.trim().slice(0, ADMIN_GAMIFICATION_BADGE_MARK_MINTED_PROBE.maxNftAddressLength)
      : '';
  if (!userId || !badgeSlug) return { ok: false, error: 'Invalid request' };
  return { ok: true, userId, badgeSlug, txHash, nftAddress };
}