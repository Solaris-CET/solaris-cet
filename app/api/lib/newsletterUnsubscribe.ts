export const NEWSLETTER_UNSUBSCRIBE_PATH = '/api/newsletter/unsubscribe';
export const NEWSLETTER_UNSUBSCRIBE_METHODS = 'GET, OPTIONS';

export const NEWSLETTER_UNSUBSCRIBE_PROBE = {
  path: NEWSLETTER_UNSUBSCRIBE_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  queryParam: 'token' as const,
  missingTokenError: 'Missing token' as const,
  invalidTokenError: 'Invalid token' as const,
  statusAlreadyUnsubscribed: 'already_unsubscribed' as const,
  statusUnsubscribed: 'unsubscribed' as const,
};

export function parseNewsletterUnsubscribeToken(url: URL): string | null {
  const token = String(url.searchParams.get(NEWSLETTER_UNSUBSCRIBE_PROBE.queryParam) ?? '').trim();
  return token || null;
}