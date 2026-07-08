import { clientIp } from './clientIp';

export const LEAD_PATH = '/api/lead';
export const LEAD_METHODS = 'POST, OPTIONS';

export const LEAD_PROBE = {
  path: LEAD_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  thankYouPath: '/multumim/' as const,
  defaultSource: 'site' as const,
  honeypotFields: ['botcheck', 'honeypot', '_gotcha'] as const,
  minPhoneDigits: 9,
  maxNameLength: 200,
  maxPhoneLength: 60,
  maxEmailLength: 254,
  maxServiceLength: 100,
  maxCountyLength: 100,
  maxDetailsLength: 4000,
  maxUrlLength: 500,
  missingFieldsError: 'Câmpuri obligatorii lipsă (nume, telefon, serviciu, județ).' as const,
  invalidPhoneError: 'Numărul de telefon nu pare corect. Te rugăm verifică-l.' as const,
  invalidEmailError: 'Adresa de email nu este validă.' as const,
  invalidRequestError: 'Cerere invalidă.' as const,
};

export type LeadRecord = {
  receivedAt: string;
  source: string;
  name: string;
  telefon: string;
  email: string;
  serviciu: string;
  judet: string;
  detalii: string;
  pageUrl: string;
  referer: string;
  userAgent: string;
  ip: string;
};

export function leadTrim(v: unknown, max = 2000): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export function parseLeadPhone(v: string): string {
  return v.replace(/[^0-9+\s-]/g, '').slice(0, LEAD_PROBE.maxPhoneLength);
}

export function isLeadHoneypotTriggered(data: Record<string, string>): boolean {
  return LEAD_PROBE.honeypotFields.some((field) => Boolean(leadTrim(data[field])));
}

export type ParsedLeadFields = {
  name: string;
  telefon: string;
  email: string;
  serviciu: string;
  judet: string;
  detalii: string;
  source: string;
};

export function parseLeadFields(data: Record<string, string>): ParsedLeadFields {
  return {
    name: leadTrim(data.name, LEAD_PROBE.maxNameLength),
    telefon: parseLeadPhone(leadTrim(data.telefon || data.phone, LEAD_PROBE.maxPhoneLength)),
    email: leadTrim(data.email, LEAD_PROBE.maxEmailLength),
    serviciu: leadTrim(data.serviciu || data.service, LEAD_PROBE.maxServiceLength),
    judet: leadTrim(data.judet || data.county, LEAD_PROBE.maxCountyLength),
    detalii: leadTrim(data.detalii || data.message, LEAD_PROBE.maxDetailsLength),
    source: leadTrim(data.from_name || data.source, 100) || LEAD_PROBE.defaultSource,
  };
}

export function validateLeadRequiredFields(fields: ParsedLeadFields): string | null {
  if (!fields.name || !fields.telefon || !fields.serviciu || !fields.judet) {
    return LEAD_PROBE.missingFieldsError;
  }
  if (fields.telefon.replace(/[^0-9]/g, '').length < LEAD_PROBE.minPhoneDigits) {
    return LEAD_PROBE.invalidPhoneError;
  }
  return null;
}

export function buildLeadRecord(req: Request, fields: ParsedLeadFields): LeadRecord {
  const referer = leadTrim(req.headers.get('referer') || '', LEAD_PROBE.maxUrlLength);
  return {
    receivedAt: new Date().toISOString(),
    source: fields.source,
    name: fields.name,
    telefon: fields.telefon,
    email: fields.email,
    serviciu: fields.serviciu,
    judet: fields.judet,
    detalii: fields.detalii,
    pageUrl: referer,
    referer,
    userAgent: leadTrim(req.headers.get('user-agent') || '', LEAD_PROBE.maxUrlLength),
    ip: clientIp(req),
  };
}

export async function readLeadPayload(req: Request): Promise<{ data: Record<string, string>; wantsHtml: boolean }> {
  const ct = (req.headers.get('content-type') || '').toLowerCase();
  if (ct.includes('application/json')) {
    const raw = await req.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw || '{}');
    } catch {
      parsed = {};
    }
    const obj = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string') out[k] = v;
    }
    return { data: out, wantsHtml: false };
  }
  const fd = await req.formData();
  const out: Record<string, string> = {};
  fd.forEach((value, key) => {
    if (typeof value === 'string') out[key] = value;
  });
  return { data: out, wantsHtml: true };
}