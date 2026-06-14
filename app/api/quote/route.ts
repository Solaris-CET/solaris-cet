/**
 * POST /api/quote
 *
 * Accepts quote request form data and stores it in the database.
 * Falls back to email if DB write fails.
 *
 * Body:
 *   name: string (min 2 chars)
 *   phone: string (Romanian format)
 *   email?: string (optional, validated if provided)
 *   location: string (required)
 *   serviceType: "fotovoltaic" | "acoperis" | "ambale" (required)
 *   powerNeeded?: string
 *   roofType?: string
 *   message?: string
 *
 * Returns:
 *   { success: true, message: "Oferta ta a fost trimisă. Te contactăm în 24h." }
 */

import { getDb } from '../../db/client';
import { quotes } from '../../db/schema';

import { getAllowedOrigin } from '../lib/cors';
import { sendEmail } from '../lib/emailProvider';
import { internalLeadNotification, clientConfirmationEmail } from '../lib/emailTemplates';

function jsonResponse(body: unknown, allowedOrigin: string, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Vary': 'Origin',
      'Cache-Control': 'no-store',
    },
  });
}

// Romanian phone regex: +40xxxxxxxxx or 07xxxxxxxx
const PHONE_REGEX = /^(\+40|0)7\d{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Vary': 'Origin',
      },
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, allowedOrigin, 405);
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, allowedOrigin, 400);
  }

  // ── Validation ──────────────────────────────────────────────────────────
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name.length < 2) {
    return jsonResponse({ error: 'Numele trebuie să aibă cel puțin 2 caractere.' }, allowedOrigin, 400);
  }

  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  if (!PHONE_REGEX.test(phone)) {
    return jsonResponse({ error: 'Numărul de telefon nu este valid (ex: +407xxxxxxxx).' }, allowedOrigin, 400);
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (email && !EMAIL_REGEX.test(email)) {
    return jsonResponse({ error: 'Adresa de email nu este validă.' }, allowedOrigin, 400);
  }

  const location = typeof body.location === 'string' ? body.location.trim() : '';
  if (!location) {
    return jsonResponse({ error: 'Locația este obligatorie.' }, allowedOrigin, 400);
  }

  const serviceType = typeof body.serviceType === 'string' ? body.serviceType.trim() : '';
  const validServiceTypes = ['fotovoltaic', 'acoperis', 'ambale'];
  if (!validServiceTypes.includes(serviceType)) {
    return jsonResponse({ error: 'Tipul serviciului trebuie să fie: fotovoltaic, acoperis sau ambale.' }, allowedOrigin, 400);
  }

  const powerNeeded = typeof body.powerNeeded === 'string' ? body.powerNeeded.trim() : null;
  const roofType = typeof body.roofType === 'string' ? body.roofType.trim() : null;
  const message = typeof body.message === 'string' ? body.message.trim() : null;

  // ── Save to database ────────────────────────────────────────────────────
  let newLeadId: string | null = null;
  try {
    const db = getDb();
    const [inserted] = await db.insert(quotes).values({
      name,
      phone,
      email: email || null,
      location,
      serviceType,
      powerNeeded,
      roofType,
      message,
    }).returning({ id: quotes.id });
    newLeadId = inserted?.id ?? null;
  } catch (dbErr) {
    console.error('DB insert error for quote:', dbErr);
    // Fallback: try to send email
    try {
      const emailBody = [
        `Nume: ${name}`,
        `Telefon: ${phone}`,
        email ? `Email: ${email}` : '',
        `Locație: ${location}`,
        `Tip serviciu: ${serviceType}`,
        powerNeeded ? `Putere necesară: ${powerNeeded}` : '',
        roofType ? `Tip acoperiș: ${roofType}` : '',
        message ? `Mesaj: ${message}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      // Use a simple fetch to a mail service or just log
      console.log('Quote email would be sent to solaris-cet@protonmail.com with body:\n', emailBody);
    } catch (emailErr) {
      console.error('Email fallback also failed:', emailErr);
    }
  }

  // ── Notify admins via push ──────────────────────────────────────────────
  if (newLeadId) {
    try {
      const internalUrl = process.env.INTERNAL_URL || `http://localhost:${process.env.PORT || 3000}`;
      await fetch(`${internalUrl}/api/push/notify-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `🌞 Lead nou: ${serviceType}`,
          body: `${name} din ${location} — ${phone}`,
          data: { leadId: newLeadId, leadType: 'quote' },
        }),
      });
    } catch (pushErr) {
      console.error('Failed to notify admins via push:', pushErr);
    }
  }

  // ── Send email notifications ──────────────────────────────────────────────
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'solaris-cet@protonmail.com';
    const internal = internalLeadNotification({
      name,
      phone,
      email: email || null,
      location,
      serviceType,
      message: message || null,
      powerNeeded: powerNeeded || null,
      roofType: roofType || null,
      receivedAt: new Date().toISOString(),
    });
    await sendEmail({ to: adminEmail, subject: internal.subject, html: internal.html, text: internal.text });
  } catch (emailErr) {
    console.error('Failed to send internal email for quote:', emailErr);
  }

  if (email) {
    try {
      const client = clientConfirmationEmail({ name, phone, serviceType, location });
      await sendEmail({ to: email, subject: client.subject, html: client.html, text: client.text });
    } catch (emailErr) {
      console.error('Failed to send client confirmation email for quote:', emailErr);
    }
  }

  return jsonResponse(
    { success: true, message: 'Oferta ta a fost trimisă. Te contactăm în 24h.' },
    allowedOrigin,
  );
}
