export const SUPPORT_START_PATH = '/api/support/start';
export const SUPPORT_START_METHODS = 'POST, OPTIONS';

export const SUPPORT_START_PROBE = {
  path: SUPPORT_START_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  rateLimitKey: 'support_start' as const,
  rateLimit: 5,
  rateWindowSeconds: 600,
  maxMessageLength: 2000,
  maxMessageLengthWithMeta: 2200,
  honeypotField: 'company' as const,
  invalidPayloadError: 'Invalid request payload' as const,
  invalidMessageError: 'Invalid message' as const,
  invalidEmailError: 'Invalid email' as const,
  tooManyRequestsError: 'Too many requests' as const,
  tooManyRequestsStatus: 429,
  visitorSender: 'visitor' as const,
  userSender: 'user' as const,
  conversationStatus: 'open' as const,
};

export type SupportStartInput = {
  name: string | null;
  email: string;
  message: string;
  pageUrl: string | null;
  utm: Record<string, unknown> | null;
  isHtmlForm: boolean;
  consent: boolean;
  honeypot: string;
};

export function asTrimmedSupportString(value: unknown, max = 2000): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export function parseSupportBoolean(value: unknown): boolean {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

export function parseSupportUtm(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === 'object' && value !== null) return value as Record<string, unknown>;
  if (typeof value !== 'string') return null;
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function supportServiceLabel(raw: string): string {
  switch (raw) {
    case 'fotovoltaice':
      return 'Fotovoltaice';
    case 'acoperisuri':
      return 'Acoperișuri tablă/țiglă';
    case 'tpo':
      return 'Acoperișuri industriale TPO';
    case 'atice-fatade':
      return 'Atice & fațade tablă';
    case 'reparatii':
      return 'Reparații & mentenanță';
    default:
      return raw;
  }
}

export function buildSupportStartMessage(parts: {
  baseMessage: string;
  service?: string;
  phone?: string;
  location?: string;
  urgent?: boolean;
  email?: string;
}): string {
  const lines = [
    parts.service ? `Serviciu: ${supportServiceLabel(parts.service)}` : null,
    parts.location ? `Locație: ${parts.location}` : null,
    parts.urgent ? 'Urgență: da' : null,
    parts.phone ? `Telefon: ${parts.phone}` : null,
    parts.email ? `Email: ${parts.email}` : null,
    '',
    parts.baseMessage,
  ].filter((line): line is string => typeof line === 'string' && line.length > 0);
  return lines.join('\n');
}

export function isSupportHtmlFormContentType(contentType: string): boolean {
  const normalized = contentType.toLowerCase();
  return normalized.includes('application/x-www-form-urlencoded') || normalized.includes('multipart/form-data');
}

export function parseSupportStartFromRecord(raw: Record<string, unknown>, isHtmlForm: boolean): SupportStartInput {
  const name = asTrimmedSupportString(raw.name, 120) || null;
  const email = asTrimmedSupportString(raw.email, 254).toLowerCase();
  const pageUrl = asTrimmedSupportString(raw.pageUrl, 600) || null;
  const utm = parseSupportUtm(raw.utm);
  const consent = parseSupportBoolean(raw.consent);
  const honeypot = asTrimmedSupportString(raw[SUPPORT_START_PROBE.honeypotField], 120);

  if (isHtmlForm) {
    const message = buildSupportStartMessage({
      baseMessage: asTrimmedSupportString(raw.message, SUPPORT_START_PROBE.maxMessageLength),
      service: asTrimmedSupportString(raw.service, 120) || undefined,
      phone: asTrimmedSupportString(raw.phone, 80) || undefined,
      location: asTrimmedSupportString(raw.location, 160) || undefined,
      urgent: parseSupportBoolean(raw.urgent),
      email: email || undefined,
    });
    return { name, email, message, pageUrl, utm, isHtmlForm, consent, honeypot };
  }

  const message = asTrimmedSupportString(raw.message, SUPPORT_START_PROBE.maxMessageLength);
  return { name, email, message, pageUrl, utm, isHtmlForm, consent, honeypot };
}

export function isValidSupportStartMessage(message: string): boolean {
  return Boolean(message) && message.length <= SUPPORT_START_PROBE.maxMessageLengthWithMeta;
}

export function buildSupportStartJsonSuccess(conversationId: string) {
  return { ok: true as const, conversationId };
}