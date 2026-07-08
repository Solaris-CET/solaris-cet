export const BADGE_CLAIM_NFT_PATH = '/api/gamification/badges/claim-nft';
export const BADGE_CLAIM_NFT_METHODS = 'POST, OPTIONS';

export const BADGE_CLAIM_NFT_PROBE = {
  path: BADGE_CLAIM_NFT_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  invalidBadgeError: 'Invalid badge' as const,
  notFoundError: 'Badge not found' as const,
  notEligibleError: 'Not eligible' as const,
};

export function parseBadgeClaimSlug(body: unknown): string {
  return typeof (body as { badgeSlug?: unknown })?.badgeSlug === 'string' ? (body as { badgeSlug: string }).badgeSlug.trim() : '';
}