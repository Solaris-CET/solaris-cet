export const NEWSLETTER_CONFIRM_PATH = '/api/newsletter/confirm';
export const NEWSLETTER_CONFIRM_METHODS = 'POST, OPTIONS';

export const NEWSLETTER_CONFIRM_PROBE = {
  path: NEWSLETTER_CONFIRM_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  rateLimitKey: 'newsletter-confirm' as const,
  rateLimit: 12,
  rateWindowSeconds: 60,
  minTokenLength: 10,
  maxTokenLength: 300,
  invalidJsonError: 'Invalid JSON' as const,
  statusInvalid: 'invalid' as const,
  statusAlreadyConfirmed: 'already_confirmed' as const,
  statusConfirmed: 'confirmed' as const,
};

export function parseNewsletterConfirmToken(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  const token = (body as { token?: unknown }).token;
  return typeof token === 'string' ? token.trim() : '';
}

export function isValidNewsletterConfirmToken(token: string): boolean {
  return (
    token.length >= NEWSLETTER_CONFIRM_PROBE.minTokenLength &&
    token.length <= NEWSLETTER_CONFIRM_PROBE.maxTokenLength
  );
}