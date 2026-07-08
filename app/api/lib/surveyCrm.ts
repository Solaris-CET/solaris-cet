import { buildSurveyBatchFileUrl } from './surveyBatch';

export const SURVEY_CRM_PATH = '/api/survey/crm';
export const SURVEY_CRM_METHODS = 'POST, OPTIONS';

export const SURVEY_CRM_PROBE = {
  path: SURVEY_CRM_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  cacheControl: 'no-store' as const,
  invalidJsonError: 'JSON invalid' as const,
  requiredFieldsError: 'Câmpuri obligatorii: report_id, pdf_filename, client_name, client_phone' as const,
  leadSource: 'survey' as const,
  leadType: 'survey_report' as const,
  serviceType: 'fotovoltaic-survey' as const,
  defaultInstallerName: 'Tehnician' as const,
  defaultClientCity: '—' as const,
  webhookEvent: 'survey_crm_lead' as const,
  defaultAdminEmail: 'solaris-cet@protonmail.com' as const,
};

export type SurveyCrmPayload = {
  report_id?: string;
  pdf_filename?: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  client_address?: string;
  client_city?: string;
  installer_id?: string;
  installer_name?: string;
  score?: number;
  capacity_kwp?: number;
  notes?: string;
};

export type ParsedSurveyCrm = {
  reportId: string;
  pdfFilename: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientCity: string;
  installerId: string;
  installerName: string;
  score: number;
  capacityKwp: number;
  notes: string;
};

export function trimSurveyCrmField(value: unknown, max = 2000): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export function parseSurveyCrmPhone(value: string): string {
  return value.replace(/[^0-9+\s-]/g, '').slice(0, 30);
}

export function parseSurveyCrmPayload(body: unknown): ParsedSurveyCrm | null {
  if (!body || typeof body !== 'object') return null;
  const rec = body as SurveyCrmPayload;
  const reportId = trimSurveyCrmField(rec.report_id, 80);
  const pdfFilename = trimSurveyCrmField(rec.pdf_filename, 200);
  const clientName = trimSurveyCrmField(rec.client_name, 200);
  const clientPhone = parseSurveyCrmPhone(trimSurveyCrmField(rec.client_phone, 60));
  if (!reportId || !pdfFilename || !clientName || !clientPhone) return null;
  return {
    reportId,
    pdfFilename,
    clientName,
    clientPhone,
    clientEmail: trimSurveyCrmField(rec.client_email, 254),
    clientCity: trimSurveyCrmField(rec.client_city, 100) || SURVEY_CRM_PROBE.defaultClientCity,
    installerId: trimSurveyCrmField(rec.installer_id, 80),
    installerName: trimSurveyCrmField(rec.installer_name, 120) || SURVEY_CRM_PROBE.defaultInstallerName,
    score: typeof rec.score === 'number' ? rec.score : 0,
    capacityKwp: typeof rec.capacity_kwp === 'number' ? rec.capacity_kwp : 0,
    notes: trimSurveyCrmField(rec.notes, 2000),
  };
}

export function surveyCrmClientIp(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    ''
  );
}

export function buildSurveyCrmPdfUrl(origin: string, pdfFilename: string): string {
  return `${origin}${buildSurveyBatchFileUrl(pdfFilename)}`;
}

export function buildSurveyCrmLeadRecord(params: {
  parsed: ParsedSurveyCrm;
  pdfUrl: string;
  receivedAt: string;
  pageUrl: string;
  userAgent: string;
  ip: string;
}) {
  const { parsed, pdfUrl, receivedAt, pageUrl, userAgent, ip } = params;
  return {
    receivedAt,
    source: SURVEY_CRM_PROBE.leadSource,
    type: SURVEY_CRM_PROBE.leadType,
    reportId: parsed.reportId,
    pdfFilename: parsed.pdfFilename,
    pdfUrl,
    name: parsed.clientName,
    telefon: parsed.clientPhone,
    email: parsed.clientEmail,
    serviciu: SURVEY_CRM_PROBE.serviceType,
    judet: parsed.clientCity,
    detalii: parsed.notes || `Raport ${parsed.reportId} · scor ${parsed.score}/100 · ${parsed.capacityKwp} kWp`,
    installerId: parsed.installerId,
    installerName: parsed.installerName,
    score: parsed.score,
    capacityKwp: parsed.capacityKwp,
    pageUrl,
    userAgent,
    ip,
  };
}

export function buildSurveyCrmLeadId(receivedAt: string, now = Date.now()): string {
  const stamp = receivedAt.replace(/[:.]/g, '-');
  const rand = Math.floor((now % 1e9) + Math.random() * 1e6).toString(36);
  return `survey-${stamp}-${rand}`;
}

export function buildSurveyCrmSuccessResponse(leadId: string | null, pdfUrl: string) {
  return { success: true as const, leadId, pdfUrl };
}

export function buildSurveyLeadEmailContent(origin: string, input: {
  reportId: string;
  clientName: string;
  clientPhone: string;
  clientCity: string;
  score: number;
  capacityKwp: number;
  installerName: string;
  pdfUrl: string;
  notes: string;
}) {
  const subject = `📋 Raport survey: ${input.clientName} — scor ${input.score}/100`;
  const html = `<!doctype html><html><body style="font-family:ui-sans-serif,sans-serif;background:#05060A;color:#EAEAF0;padding:24px;">
    <div style="max-width:640px;margin:0 auto;border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:22px;">
      <h1 style="margin:0 0 12px;font-size:20px;color:#fbbf24;">Raport survey generat</h1>
      <p><strong>Client:</strong> ${input.clientName} (${input.clientCity})</p>
      <p><strong>Telefon:</strong> ${input.clientPhone}</p>
      <p><strong>Tehnician:</strong> ${input.installerName}</p>
      <p><strong>Raport:</strong> ${input.reportId} · Scor ${input.score}/100 · ${input.capacityKwp} kWp</p>
      ${input.notes ? `<p><strong>Note:</strong> ${input.notes}</p>` : ''}
      <p style="margin-top:18px;"><a href="${input.pdfUrl}" style="display:inline-block;padding:12px 16px;border-radius:14px;background:rgba(255,220,165,.12);border:1px solid rgba(255,220,165,.35);color:#fbbf24;font-weight:700;text-decoration:none;">Descarcă PDF</a></p>
      <p style="font-size:12px;color:rgba(234,234,240,.6);margin-top:16px;">SOLARIS CET Survey · <a href="${origin}" style="color:#fbbf24;">${origin}</a></p>
    </div></body></html>`;
  const text = `Raport survey ${input.reportId}: ${input.clientName}, scor ${input.score}/100. PDF: ${input.pdfUrl}`;
  return { subject, html, text };
}

export function buildSurveyCrmWebhookPayload(params: {
  leadId: string | null;
  parsed: ParsedSurveyCrm;
  pdfUrl: string;
}) {
  const { leadId, parsed, pdfUrl } = params;
  return {
    event: SURVEY_CRM_PROBE.webhookEvent,
    leadId,
    reportId: parsed.reportId,
    pdfUrl,
    clientName: parsed.clientName,
    clientPhone: parsed.clientPhone,
    clientCity: parsed.clientCity,
    installerId: parsed.installerId,
    installerName: parsed.installerName,
    score: parsed.score,
    capacityKwp: parsed.capacityKwp,
  };
}

export function buildSurveyCrmTelegramMessage(parsed: ParsedSurveyCrm, pdfUrl: string): string {
  return `📋 Survey CRM: ${parsed.clientName} (${parsed.clientCity})\n${parsed.installerName} · ${parsed.reportId} · scor ${parsed.score}/100 · ${parsed.capacityKwp} kWp\n${pdfUrl}`;
}

export function resolveSurveyCrmLeadDir(env: NodeJS.ProcessEnv = process.env): string {
  return (env.LEAD_STORAGE_DIR || '/data/solaris-cet/leads').trim();
}