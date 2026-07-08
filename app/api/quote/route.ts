import { getDb } from '@/db/client';
import { quotes } from '@/db/schema';
import { getAllowedOrigin } from '@/api/lib/cors';
import { sendEmail } from '@/api/lib/emailProvider';
import { clientConfirmationEmail, internalLeadNotification } from '@/api/lib/emailTemplates';
import {
  buildQuoteFallbackEmailBody,
  parseQuoteBody,
  QUOTE_PROBE,
  validateQuoteFields,
} from '../lib/quoteRequest';

export { QUOTE_PATH, QUOTE_PROBE } from '@/api/lib/quoteRequest';

export const config = { runtime: 'nodejs' };

function jsonResponse(body: unknown, allowedOrigin: string, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
      'Cache-Control': 'no-store',
    },
  });
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': QUOTE_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, allowedOrigin, 405);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: QUOTE_PROBE.invalidJsonError }, allowedOrigin, 400);
  }

  const fields = parseQuoteBody(body);
  if (!fields) {
    return jsonResponse({ error: QUOTE_PROBE.invalidServiceTypeError }, allowedOrigin, 400);
  }

  const validationError = validateQuoteFields(fields);
  if (validationError) {
    return jsonResponse({ error: validationError }, allowedOrigin, 400);
  }

  const { name, phone, email, location, serviceType, powerNeeded, roofType, message } = fields;

  let newLeadId: string | null = null;
  try {
    const db = getDb();
    const [inserted] = await db
      .insert(quotes)
      .values({
        name,
        phone,
        email: email || null,
        location,
        serviceType,
        powerNeeded,
        roofType,
        message,
      })
      .returning({ id: quotes.id });
    newLeadId = inserted?.id ?? null;
  } catch (dbErr) {
    console.error('DB insert error for quote:', dbErr);
    try {
      console.log(
        `Quote email would be sent to ${QUOTE_PROBE.defaultAdminEmail} with body:\n`,
        buildQuoteFallbackEmailBody(fields),
      );
    } catch (emailErr) {
      console.error('Email fallback also failed:', emailErr);
    }
  }

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

  try {
    const adminEmail = process.env.ADMIN_EMAIL || QUOTE_PROBE.defaultAdminEmail;
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

  return jsonResponse({ success: true, message: QUOTE_PROBE.successMessage }, allowedOrigin);
}