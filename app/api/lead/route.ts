// /api/lead — captures contact-form submissions without external dependencies.
// Accepts both JSON (`Content-Type: application/json`) and HTML form posts
// (`application/x-www-form-urlencoded` / `multipart/form-data`). Writes the
// lead to disk (LEAD_STORAGE_DIR or /data/solaris-cet/leads) and returns 200
// for JS callers or redirects to /multumim for no-JS browsers.

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { getAllowedOrigin } from '../lib/cors';
import { sendEmail } from '../lib/emailProvider';
import { internalLeadNotification, clientConfirmationEmail } from '../lib/emailTemplates';

export const config = { runtime: 'nodejs' };

const LEAD_DIR = (process.env.LEAD_STORAGE_DIR || '/data/solaris-cet/leads').trim();
const THANK_YOU_URL = '/multumim/';

type Lead = {
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

function trim(v: unknown, max = 2000): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function parsePhone(v: string): string {
  return v.replace(/[^0-9+\s-]/g, '').slice(0, 30);
}

function isValidEmail(value: string): boolean {
  if (!value) return true; // optional
  if (value.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function clientIp(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    ''
  );
}

async function readPayload(req: Request): Promise<{ data: Record<string, string>; wantsHtml: boolean }> {
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
  // Treat both urlencoded and multipart the same way via formData()
  const fd = await req.formData();
  const out: Record<string, string> = {};
  fd.forEach((value, key) => {
    if (typeof value === 'string') out[key] = value;
  });
  return { data: out, wantsHtml: true };
}

function htmlSuccessPage(): string {
  return `<!doctype html><html lang="ro"><head><meta charset="utf-8"><title>Mulțumim — Solaris CET</title><meta http-equiv="refresh" content="3;url=${THANK_YOU_URL}"><meta name="robots" content="noindex"><style>body{margin:0;font-family:ui-sans-serif,system-ui,sans-serif;background:#05070a;color:#fff}main{max-width:680px;margin:0 auto;padding:48px 22px;text-align:center}.card{border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.35);border-radius:18px;padding:32px}h1{color:#fbbf24;margin:0 0 14px}a{color:#fbbf24}</style></head><body><main><div class="card"><h1>Mulțumim!</h1><p>Cererea ta a fost primită. Te contactăm în maxim 24 de ore (luni–sâmbătă).</p><p>Pentru urgențe: <a href="tel:+40769889721">+40 769 889 721</a></p><p>Te redirecționăm către pagina de confirmare în câteva secunde — sau apasă <a href="${THANK_YOU_URL}">aici</a>.</p></div></main></body></html>`;
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, 'Vary': 'Origin' },
    });
  }

  let payload: { data: Record<string, string>; wantsHtml: boolean };
  try {
    payload = await readPayload(req);
  } catch {
    return new Response(JSON.stringify({ error: 'Cerere invalidă.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, 'Vary': 'Origin' },
    });
  }
  const { data, wantsHtml } = payload;

  // Honeypot — silently ignore bots without leaking the check.
  if (trim(data.botcheck) || trim(data.honeypot) || trim(data._gotcha)) {
    if (wantsHtml) {
      return new Response(htmlSuccessPage(), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, 'Vary': 'Origin' },
    });
  }

  const name = trim(data.name, 200);
  const telefon = parsePhone(trim(data.telefon || data.phone, 60));
  const email = trim(data.email, 254);
  const serviciu = trim(data.serviciu || data.service, 100);
  const judet = trim(data.judet || data.county, 100);
  const detalii = trim(data.detalii || data.message, 4000);

  if (!name || !telefon || !serviciu || !judet) {
    const msg = 'Câmpuri obligatorii lipsă (nume, telefon, serviciu, județ).';
    if (wantsHtml) {
      return new Response(htmlErrorPage(msg), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, 'Vary': 'Origin' },
    });
  }
  if (telefon.replace(/[^0-9]/g, '').length < 9) {
    const msg = 'Numărul de telefon nu pare corect. Te rugăm verifică-l.';
    if (wantsHtml) {
      return new Response(htmlErrorPage(msg), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, 'Vary': 'Origin' },
    });
  }
  if (email && !isValidEmail(email)) {
    const msg = 'Adresa de email nu este validă.';
    if (wantsHtml) {
      return new Response(htmlErrorPage(msg), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, 'Vary': 'Origin' },
    });
  }

  const lead: Lead = {
    receivedAt: new Date().toISOString(),
    source: trim(data.from_name || data.source, 100) || 'site',
    name,
    telefon,
    email,
    serviciu,
    judet,
    detalii,
    pageUrl: trim(req.headers.get('referer') || '', 500),
    referer: trim(req.headers.get('referer') || '', 500),
    userAgent: trim(req.headers.get('user-agent') || '', 500),
    ip: clientIp(req),
  };

  try {
    await fs.mkdir(LEAD_DIR, { recursive: true });
    const stamp = lead.receivedAt.replace(/[:.]/g, '-');
    const rand = Math.floor((Date.now() % 1e9) + Math.random() * 1e6).toString(36);
    const file = path.join(LEAD_DIR, `lead-${stamp}-${rand}.json`);
    await fs.writeFile(file, JSON.stringify(lead, null, 2), 'utf8');
    const ledger = path.join(LEAD_DIR, 'leads.jsonl');
    await fs.appendFile(ledger, JSON.stringify(lead) + '\n', 'utf8');
  } catch (err) {
    console.error('lead persist failed', err);
    // We still return success to the visitor; they shouldn't see infra issues.
    // The lead is logged to stdout below so it's recoverable from container logs.
  }
  console.log('[lead]', JSON.stringify(lead));

  // ── Send email notifications ──────────────────────────────────────────────
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
      headers: { Location: THANK_YOU_URL, 'Cache-Control': 'no-store' },
    });
  }

  return new Response(JSON.stringify({ success: true, redirect: THANK_YOU_URL }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Vary': 'Origin',
      'Cache-Control': 'no-store',
    },
  });
}
