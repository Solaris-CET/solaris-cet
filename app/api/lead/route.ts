// /api/lead — captures contact-form submissions without external dependencies.

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { getAllowedOrigin } from '@/api/lib/cors';
import { sendEmail } from '@/api/lib/emailProvider';
import { clientConfirmationEmail, internalLeadNotification } from '@/api/lib/emailTemplates';
import { isValidEmail } from '@/api/lib/http';
import {
  buildLeadRecord,
  isLeadHoneypotTriggered,
  LEAD_PROBE,
  parseLeadFields,
  readLeadPayload,
  validateLeadRequiredFields,
} from '../lib/leadCapture';

export { LEAD_PATH, LEAD_PROBE } from '@/api/lib/leadCapture';

export const config = { runtime: 'nodejs' };

const LEAD_DIR = (process.env.LEAD_STORAGE_DIR || '/data/solaris-cet/leads').trim();

function htmlSuccessPage(): string {
  return `<!doctype html><html lang="ro"><head><meta charset="utf-8"><title>Mulțumim — Solaris CET</title><meta http-equiv="refresh" content="3;url=${LEAD_PROBE.thankYouPath}"><meta name="robots" content="noindex"><style>body{margin:0;font-family:ui-sans-serif,system-ui,sans-serif;background:#05070a;color:#fff}main{max-width:680px;margin:0 auto;padding:48px 22px;text-align:center}.card{border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.35);border-radius:18px;padding:32px}h1{color:#fbbf24;margin:0 0 14px}a{color:#fbbf24}</style></head><body><main><div class="card"><h1>Mulțumim!</h1><p>Cererea ta a fost primită. Te contactăm în maxim 24 de ore (luni–sâmbătă).</p><p>Pentru urgențe: <a href="tel:+40769889721">+40 769 889 721</a></p><p>Te redirecționăm către pagina de confirmare în câteva secunde — sau apasă <a href="${LEAD_PROBE.thankYouPath}">aici</a>.</p></div></main></body></html>`;
}

function htmlErrorPage(message: string): string {
  return `<!doctype html><html lang="ro"><head><meta charset="utf-8"><title>Eroare — Solaris CET</title><meta name="robots" content="noindex"><style>body{margin:0;font-family:ui-sans-serif,system-ui,sans-serif;background:#05070a;color:#fff}main{max-width:680px;margin:0 auto;padding:48px 22px;text-align:center}.card{border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.35);border-radius:18px;padding:32px}h1{color:#f87171;margin:0 0 14px}a{color:#fbbf24}</style></head><body><main><div class="card"><h1>Nu am putut salva cererea</h1><p>${message}</p><p>Te rugăm să ne suni direct la <a href="tel:+40769889721">+40 769 889 721</a> sau să scrii la <a href="mailto:contact@solaris-cet.com">contact@solaris-cet.com</a>.</p><p><a href="/contact">Înapoi la formular</a></p></div></main></body></html>`;
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': LEAD_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }

  let payload: { data: Record<string, string>; wantsHtml: boolean };
  try {
    payload = await readLeadPayload(req);
  } catch {
    return new Response(JSON.stringify({ error: LEAD_PROBE.invalidRequestError }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }
  const { data, wantsHtml } = payload;

  if (isLeadHoneypotTriggered(data)) {
    if (wantsHtml) {
      return new Response(htmlSuccessPage(), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }

  const fields = parseLeadFields(data);
  const requiredError = validateLeadRequiredFields(fields);
  if (requiredError) {
    if (wantsHtml) {
      return new Response(htmlErrorPage(requiredError), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
    return new Response(JSON.stringify({ error: requiredError }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }

  if (fields.email && !isValidEmail(fields.email)) {
    if (wantsHtml) {
      return new Response(htmlErrorPage(LEAD_PROBE.invalidEmailError), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
    return new Response(JSON.stringify({ error: LEAD_PROBE.invalidEmailError }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }

  const lead = buildLeadRecord(req, fields);

  let newLeadId: string | null = null;
  try {
    await fs.mkdir(LEAD_DIR, { recursive: true });
    const stamp = lead.receivedAt.replace(/[:.]/g, '-');
    const rand = Math.floor((Date.now() % 1e9) + Math.random() * 1e6).toString(36);
    const file = path.join(LEAD_DIR, `lead-${stamp}-${rand}.json`);
    await fs.writeFile(file, JSON.stringify(lead, null, 2), 'utf8');
    const ledger = path.join(LEAD_DIR, 'leads.jsonl');
    await fs.appendFile(ledger, JSON.stringify(lead) + '\n', 'utf8');
    newLeadId = `${stamp}-${rand}`;
  } catch (err) {
    console.error('lead persist failed', err);
  }
  console.log('[lead]', JSON.stringify(lead));

  if (newLeadId) {
    try {
      const internalUrl = process.env.INTERNAL_URL || `http://localhost:${process.env.PORT || 3000}`;
      await fetch(`${internalUrl}/api/push/notify-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `🌞 Lead nou: ${lead.serviciu}`,
          body: `${lead.name} din ${lead.judet} — ${lead.telefon}`,
          data: { leadId: newLeadId, leadType: 'lead' },
        }),
      });
    } catch (pushErr) {
      console.error('Failed to notify admins via push:', pushErr);
    }
  }

  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'solaris-cet@protonmail.com';
    const internal = internalLeadNotification({
      name: lead.name,
      phone: lead.telefon,
      email: lead.email || null,
      location: lead.judet,
      serviceType: lead.serviciu,
      message: lead.detalii || null,
      receivedAt: lead.receivedAt,
    });
    await sendEmail({ to: adminEmail, subject: internal.subject, html: internal.html, text: internal.text });
  } catch (emailErr) {
    console.error('Failed to send internal email for lead:', emailErr);
  }

  if (lead.email) {
    try {
      const client = clientConfirmationEmail({
        name: lead.name,
        phone: lead.telefon,
        serviceType: lead.serviciu,
        location: lead.judet,
      });
      await sendEmail({ to: lead.email, subject: client.subject, html: client.html, text: client.text });
    } catch (emailErr) {
      console.error('Failed to send client confirmation email for lead:', emailErr);
    }
  }

  if (wantsHtml) {
    return new Response(null, {
      status: 303,
      headers: { Location: LEAD_PROBE.thankYouPath, 'Cache-Control': 'no-store' },
    });
  }

  return new Response(JSON.stringify({ success: true, redirect: LEAD_PROBE.thankYouPath }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
      'Cache-Control': 'no-store',
    },
  });
}