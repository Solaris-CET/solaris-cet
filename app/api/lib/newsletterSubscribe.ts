export const NEWSLETTER_SUBSCRIBE_PATH = '/api/newsletter/subscribe';
export const NEWSLETTER_SUBSCRIBE_METHODS = 'POST, OPTIONS';

export const NEWSLETTER_SUBSCRIBE_PROBE = {
  path: NEWSLETTER_SUBSCRIBE_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  maxLocaleLength: 12,
  consentRequiredError: 'Consent required' as const,
  invalidEmailError: 'Invalid email' as const,
  invalidJsonError: 'Invalid JSON' as const,
  verifyTemplate: 'newsletter_verify' as const,
};

export type ParsedNewsletterSubscribeBody = {
  email: string;
  locale: string | null;
  consent: boolean;
};

export function parseNewsletterSubscribeBody(body: unknown): ParsedNewsletterSubscribeBody | null {
  if (!body || typeof body !== 'object') return null;
  const rec = body as Record<string, unknown>;
  const email = typeof rec.email === 'string' ? rec.email.trim() : '';
  const locale =
    typeof rec.locale === 'string' ? rec.locale.trim().slice(0, NEWSLETTER_SUBSCRIBE_PROBE.maxLocaleLength) : null;
  const consent = rec.consent === true;
  return { email, locale, consent };
}