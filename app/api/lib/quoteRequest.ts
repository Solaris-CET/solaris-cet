export const QUOTE_PATH = '/api/quote';
export const QUOTE_METHODS = 'POST, OPTIONS';

export const QUOTE_PROBE = {
  path: QUOTE_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  minNameLength: 2,
  serviceTypes: ['fotovoltaic', 'acoperis', 'ambale'] as const,
  successMessage: 'Oferta ta a fost trimisă. Te contactăm în 24h.' as const,
  invalidJsonError: 'Invalid JSON body' as const,
  invalidNameError: 'Numele trebuie să aibă cel puțin 2 caractere.' as const,
  invalidPhoneError: 'Numărul de telefon nu este valid (ex: +407xxxxxxxx).' as const,
  invalidEmailError: 'Adresa de email nu este validă.' as const,
  missingLocationError: 'Locația este obligatorie.' as const,
  invalidServiceTypeError: 'Tipul serviciului trebuie să fie: fotovoltaic, acoperis sau ambale.' as const,
  defaultAdminEmail: 'solaris-cet@protonmail.com' as const,
};

export type QuoteServiceType = (typeof QUOTE_PROBE.serviceTypes)[number];

export type ParsedQuoteBody = {
  name: string;
  phone: string;
  email: string;
  location: string;
  serviceType: QuoteServiceType;
  powerNeeded: string | null;
  roofType: string | null;
  message: string | null;
};

const QUOTE_PHONE_REGEX = /^(\+40|0)7\d{8}$/;
const QUOTE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidQuotePhone(phone: string): boolean {
  return QUOTE_PHONE_REGEX.test(phone);
}

export function isValidQuoteEmail(email: string): boolean {
  return !email || QUOTE_EMAIL_REGEX.test(email);
}

export function isValidQuoteServiceType(value: string): value is QuoteServiceType {
  return (QUOTE_PROBE.serviceTypes as readonly string[]).includes(value);
}

export function parseQuoteBody(body: unknown): ParsedQuoteBody | null {
  if (!body || typeof body !== 'object') return null;
  const rec = body as Record<string, unknown>;
  const name = typeof rec.name === 'string' ? rec.name.trim() : '';
  const phone = typeof rec.phone === 'string' ? rec.phone.trim() : '';
  const email = typeof rec.email === 'string' ? rec.email.trim() : '';
  const location = typeof rec.location === 'string' ? rec.location.trim() : '';
  const serviceType = typeof rec.serviceType === 'string' ? rec.serviceType.trim() : '';
  const powerNeeded = typeof rec.powerNeeded === 'string' ? rec.powerNeeded.trim() : null;
  const roofType = typeof rec.roofType === 'string' ? rec.roofType.trim() : null;
  const message = typeof rec.message === 'string' ? rec.message.trim() : null;
  if (!isValidQuoteServiceType(serviceType)) return null;
  return { name, phone, email, location, serviceType, powerNeeded, roofType, message };
}

export function validateQuoteFields(fields: ParsedQuoteBody): string | null {
  if (fields.name.length < QUOTE_PROBE.minNameLength) return QUOTE_PROBE.invalidNameError;
  if (!isValidQuotePhone(fields.phone)) return QUOTE_PROBE.invalidPhoneError;
  if (!isValidQuoteEmail(fields.email)) return QUOTE_PROBE.invalidEmailError;
  if (!fields.location) return QUOTE_PROBE.missingLocationError;
  if (!isValidQuoteServiceType(fields.serviceType)) return QUOTE_PROBE.invalidServiceTypeError;
  return null;
}

export function buildQuoteFallbackEmailBody(fields: ParsedQuoteBody): string {
  return [
    `Nume: ${fields.name}`,
    `Telefon: ${fields.phone}`,
    fields.email ? `Email: ${fields.email}` : '',
    `Locație: ${fields.location}`,
    `Tip serviciu: ${fields.serviceType}`,
    fields.powerNeeded ? `Putere necesară: ${fields.powerNeeded}` : '',
    fields.roofType ? `Tip acoperiș: ${fields.roofType}` : '',
    fields.message ? `Mesaj: ${fields.message}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}