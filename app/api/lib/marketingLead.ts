export const MARKETING_LEAD_PATH = '/api/marketing/lead';
export const MARKETING_LEAD_METHODS = 'POST, OPTIONS';

export const MARKETING_LEAD_PROBE = {
  path: MARKETING_LEAD_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  maxNameLength: 160,
  maxLocaleLength: 12,
  maxPageUrlLength: 500,
  maxUtmFieldLength: 180,
  consentRequiredError: 'Consent required' as const,
  invalidEmailError: 'Invalid email' as const,
  invalidJsonError: 'Invalid JSON' as const,
};

export type MarketingUtm = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  li_fat_id?: string;
  campaign?: string;
};

export type ParsedMarketingLeadBody = {
  email: string;
  name: string | null;
  locale: string | null;
  consent: boolean;
  newsletter: boolean;
  pageUrl: string | null;
  utm: MarketingUtm | null;
};

export function pickMarketingUtm(input: unknown): MarketingUtm | null {
  if (!input || typeof input !== 'object') return null;
  const v = input as Record<string, unknown>;
  const take = (k: keyof MarketingUtm) =>
    typeof v[k] === 'string' && String(v[k]).trim()
      ? String(v[k]).trim().slice(0, MARKETING_LEAD_PROBE.maxUtmFieldLength)
      : undefined;
  const out: MarketingUtm = {
    utm_source: take('utm_source'),
    utm_medium: take('utm_medium'),
    utm_campaign: take('utm_campaign'),
    utm_term: take('utm_term'),
    utm_content: take('utm_content'),
    gclid: take('gclid'),
    fbclid: take('fbclid'),
    li_fat_id: take('li_fat_id'),
    campaign: take('campaign'),
  };
  const has = Object.values(out).some((x) => typeof x === 'string' && x);
  return has ? out : null;
}

export function parseMarketingLeadBody(body: unknown): ParsedMarketingLeadBody | null {
  if (!body || typeof body !== 'object') return null;
  const rec = body as Record<string, unknown>;
  const email = typeof rec.email === 'string' ? rec.email.trim() : '';
  const name = typeof rec.name === 'string' ? rec.name.trim().slice(0, MARKETING_LEAD_PROBE.maxNameLength) : null;
  const locale =
    typeof rec.locale === 'string' ? rec.locale.trim().slice(0, MARKETING_LEAD_PROBE.maxLocaleLength) : null;
  const consent = rec.consent === true;
  const newsletter = rec.newsletter !== false;
  const pageUrl =
    typeof rec.pageUrl === 'string' ? rec.pageUrl.trim().slice(0, MARKETING_LEAD_PROBE.maxPageUrlLength) : null;
  const utm = pickMarketingUtm(rec.utm);
  return { email, name, locale, consent, newsletter, pageUrl, utm };
}