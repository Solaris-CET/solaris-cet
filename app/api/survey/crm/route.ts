// /api/survey/crm — înregistrează raport survey în CRM + notifică admin cu link PDF

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { getAllowedOrigin } from '../../lib/cors';
import { sendEmail } from '../../lib/emailProvider';
import { publicOrigin } from '../../lib/publicOrigin';
import { dispatchSurveyWebhook } from '../../lib/surveyWebhook';
import { sendTelegramNotify } from '../../lib/telegramNotify';

export const config = { runtime: 'nodejs' };

const LEAD_DIR = (process.env.LEAD_STORAGE_DIR || '/data/solaris-cet/leads').trim();

type SurveyCrmPayload = {
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

function trim(v: unknown, max = 2000): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function parsePhone(v: string): string {
  return v.replace(/[^0-9+\s-]/g, '').slice(0, 30);
}

function clientIp(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    ''
  );
}

function surveyLeadEmail(req: Request, input: {
  reportId: string;
  clientName: string;
  clientPhone: string;
  clientCity: string;
  score: number;
  capacityKwp: number;
  installerName: string;
  pdfUrl: string;
  notes: string;
}): { subject: string; html: string; text: string } {
  const origin = publicOrigin(req);
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

export default async function handler(req: Request): Promise<Response> {
  const allowed = getAllowedOrigin(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowed,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowed, Vary: 'Origin' },
    });
  }

  let body: SurveyCrmPayload;
  try {
    body = (await req.json()) as SurveyCrmPayload;
  } catch {
    return new Response(JSON.stringify({ error: 'JSON invalid' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowed, Vary: 'Origin' },
    });
  }

  const reportId = trim(body.report_id, 80);
  const pdfFilename = trim(body.pdf_filename, 200);
  const clientName = trim(body.client_name, 200);
  const clientPhone = parsePhone(trim(body.client_phone, 60));
  const clientCity = trim(body.client_city, 100) || '—';
  const installerId = trim(body.installer_id, 80);
  const installerName = trim(body.installer_name, 120) || 'Tehnician';
  const score = typeof body.score === 'number' ? body.score : 0;
  const capacityKwp = typeof body.capacity_kwp === 'number' ? body.capacity_kwp : 0;
  const notes = trim(body.notes, 2000);

  if (!reportId || !pdfFilename || !clientName || !clientPhone) {
    return new Response(JSON.stringify({ error: 'Câmpuri obligatorii: report_id, pdf_filename, client_name, client_phone' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowed, Vary: 'Origin' },
    });
  }

  const origin = publicOrigin(req);
  const pdfUrl = `${origin}/api/survey/files?file=${encodeURIComponent(pdfFilename)}`;

  const lead = {
    receivedAt: new Date().toISOString(),
    source: 'survey',
    type: 'survey_report',
    reportId,
    pdfFilename,
    pdfUrl,
    name: clientName,
    telefon: clientPhone,
    email: trim(body.client_email, 254),
    serviciu: 'fotovoltaic-survey',
    judet: clientCity,
    detalii: notes || `Raport ${reportId} · scor ${score}/100 · ${capacityKwp} kWp`,
    installerId,
    installerName,
    score,
    capacityKwp,
    pageUrl: trim(req.headers.get('referer') || '', 500),
    userAgent: trim(req.headers.get('user-agent') || '', 500),
    ip: clientIp(req),
  };

  let leadId: string | null = null;
  try {
    await fs.mkdir(LEAD_DIR, { recursive: true });
    const stamp = lead.receivedAt.replace(/[:.]/g, '-');
    const rand = Math.floor((Date.now() % 1e9) + Math.random() * 1e6).toString(36);
    const file = path.join(LEAD_DIR, `survey-${stamp}-${rand}.json`);
    await fs.writeFile(file, JSON.stringify(lead, null, 2), 'utf8');
    const ledger = path.join(LEAD_DIR, 'surveys.jsonl');
    await fs.appendFile(ledger, JSON.stringify(lead) + '\n', 'utf8');
    leadId = `survey-${stamp}-${rand}`;
  } catch (err) {
    console.error('survey crm persist failed', err);
  }
  console.log('[survey-crm]', JSON.stringify(lead));

  if (leadId) {
    try {
      const internalUrl = process.env.INTERNAL_URL || `http://localhost:${process.env.PORT || 3000}`;
      await fetch(`${internalUrl}/api/push/notify-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `📋 Survey: ${clientName}`,
          body: `${installerName} · scor ${score}/100 · ${capacityKwp} kWp`,
          data: { leadId, leadType: 'survey', reportId },
        }),
      });
    } catch (pushErr) {
      console.error('survey crm push failed', pushErr);
    }
  }

  void sendTelegramNotify(
    `📋 Survey CRM: ${clientName} (${clientCity})\n${installerName} · ${reportId} · scor ${score}/100 · ${capacityKwp} kWp\n${pdfUrl}`,
  );

  void dispatchSurveyWebhook({
    event: 'survey_crm_lead',
    leadId,
    reportId,
    pdfUrl,
    clientName,
    clientPhone,
    clientCity,
    installerId,
    installerName,
    score,
    capacityKwp,
  });

  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'solaris-cet@protonmail.com';
    const mail = surveyLeadEmail(req, {
      reportId,
      clientName,
      clientPhone,
      clientCity,
      score,
      capacityKwp,
      installerName,
      pdfUrl,
      notes,
    });
    await sendEmail({ to: adminEmail, subject: mail.subject, html: mail.html, text: mail.text });
  } catch (emailErr) {
    console.error('survey crm email failed', emailErr);
  }

  return new Response(JSON.stringify({ success: true, leadId, pdfUrl }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowed,
      Vary: 'Origin',
      'Cache-Control': 'no-store',
    },
  });
}