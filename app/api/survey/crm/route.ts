import { promises as fs } from 'node:fs';
import path from 'node:path';

import { getAllowedOrigin } from '@/api/lib/cors';
import { sendEmail } from '@/api/lib/emailProvider';
import { publicOrigin } from '@/api/lib/publicOrigin';
import {
  buildSurveyCrmLeadId,
  buildSurveyCrmLeadRecord,
  buildSurveyCrmPdfUrl,
  buildSurveyCrmSuccessResponse,
  buildSurveyCrmTelegramMessage,
  buildSurveyCrmWebhookPayload,
  buildSurveyLeadEmailContent,
  parseSurveyCrmPayload,
  resolveSurveyCrmLeadDir,
  SURVEY_CRM_PROBE,
  surveyCrmClientIp,
  trimSurveyCrmField,
} from '../../lib/surveyCrm';
import { dispatchSurveyWebhook } from '@/api/lib/surveyWebhook';
import { sendTelegramNotify } from '@/api/lib/telegramNotify';

export { SURVEY_CRM_PATH, SURVEY_CRM_PROBE } from '@/api/lib/surveyCrm';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const allowed = getAllowedOrigin(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowed,
        'Access-Control-Allow-Methods': SURVEY_CRM_PROBE.methods.join(', '),
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: SURVEY_CRM_PROBE.invalidJsonError }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowed, Vary: 'Origin' },
    });
  }

  const parsed = parseSurveyCrmPayload(body);
  if (!parsed) {
    return new Response(JSON.stringify({ error: SURVEY_CRM_PROBE.requiredFieldsError }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowed, Vary: 'Origin' },
    });
  }

  const origin = publicOrigin(req);
  const pdfUrl = buildSurveyCrmPdfUrl(origin, parsed.pdfFilename);
  const receivedAt = new Date().toISOString();
  const lead = buildSurveyCrmLeadRecord({
    parsed,
    pdfUrl,
    receivedAt,
    pageUrl: trimSurveyCrmField(req.headers.get('referer') || '', 500),
    userAgent: trimSurveyCrmField(req.headers.get('user-agent') || '', 500),
    ip: surveyCrmClientIp(req),
  });

  let leadId: string | null = null;
  const leadDir = resolveSurveyCrmLeadDir();
  try {
    await fs.mkdir(leadDir, { recursive: true });
    leadId = buildSurveyCrmLeadId(receivedAt);
    const file = path.join(leadDir, `${leadId}.json`);
    await fs.writeFile(file, JSON.stringify(lead, null, 2), 'utf8');
    const ledger = path.join(leadDir, 'surveys.jsonl');
    await fs.appendFile(ledger, JSON.stringify(lead) + '\n', 'utf8');
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
          title: `📋 Survey: ${parsed.clientName}`,
          body: `${parsed.installerName} · scor ${parsed.score}/100 · ${parsed.capacityKwp} kWp`,
          data: { leadId, leadType: 'survey', reportId: parsed.reportId },
        }),
      });
    } catch (pushErr) {
      console.error('survey crm push failed', pushErr);
    }
  }

  void sendTelegramNotify(buildSurveyCrmTelegramMessage(parsed, pdfUrl));

  void dispatchSurveyWebhook(buildSurveyCrmWebhookPayload({ leadId, parsed, pdfUrl }));

  try {
    const adminEmail = process.env.ADMIN_EMAIL || SURVEY_CRM_PROBE.defaultAdminEmail;
    const mail = buildSurveyLeadEmailContent(origin, {
      reportId: parsed.reportId,
      clientName: parsed.clientName,
      clientPhone: parsed.clientPhone,
      clientCity: parsed.clientCity,
      score: parsed.score,
      capacityKwp: parsed.capacityKwp,
      installerName: parsed.installerName,
      pdfUrl,
      notes: parsed.notes,
    });
    await sendEmail({ to: adminEmail, subject: mail.subject, html: mail.html, text: mail.text });
  } catch (emailErr) {
    console.error('survey crm email failed', emailErr);
  }

  return new Response(JSON.stringify(buildSurveyCrmSuccessResponse(leadId, pdfUrl)), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowed,
      Vary: 'Origin',
      'Cache-Control': SURVEY_CRM_PROBE.cacheControl,
    },
  });
}