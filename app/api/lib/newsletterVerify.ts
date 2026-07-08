export const NEWSLETTER_VERIFY_PATH = '/api/newsletter/verify';
export const NEWSLETTER_VERIFY_METHODS = 'GET, OPTIONS';

export const NEWSLETTER_VERIFY_PROBE = {
  path: NEWSLETTER_VERIFY_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  queryParam: 'token' as const,
  missingTokenError: 'Missing token' as const,
  invalidTokenError: 'Invalid token' as const,
  unsubscribedError: 'Unsubscribed' as const,
  statusAlreadyActive: 'already_active' as const,
  statusVerified: 'verified' as const,
};

export function parseNewsletterVerifyToken(url: URL): string | null {
  const token = String(url.searchParams.get(NEWSLETTER_VERIFY_PROBE.queryParam) ?? '').trim();
  return token || null;
}