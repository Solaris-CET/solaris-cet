export const AFFILIATE_CLICK_PATH = '/api/gamification/affiliate/click';
export const AFFILIATE_CLICK_METHODS = 'POST, OPTIONS';

export const AFFILIATE_CLICK_PROBE = {
  path: AFFILIATE_CLICK_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  rateLimitKey: 'affiliate-click',
  rateLimit: 120,
  rateLimitWindowSeconds: 60,
  invalidJsonError: 'Invalid JSON' as const,
  invalidCodeError: 'Invalid code' as const,
};

export function parseAffiliateClickCode(body: unknown): string {
  return typeof (body as { code?: unknown })?.code === 'string' ? (body as { code: string }).code.trim() : '';
}