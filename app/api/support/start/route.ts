import { getDb, schema } from '../../../db/client';
import { requireUser } from '../../lib/authUser';
import { getAllowedOrigin } from '../../lib/cors';
import { corsJson, corsOptions, isValidEmail, readJson } from '../../lib/http';
import { decideRateLimit, rateLimitHeaders } from '../../lib/publicApiRateLimit';

export const config = { runtime: 'nodejs' };

type SupportInput = {
  name: string | null;
  email: string;
  message: string;
  pageUrl: string | null;
  utm: Record<string, unknown> | null;
  isHtmlForm: boolean;
  consent: boolean;
  honeypot: string;
};

function asTrimmedString(value: unknown, max = 2000): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function parseBoolean(value: unknown): boolean {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function parseUtm(value: unknown): Record<string, unknown> | null {
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

function serviceLabel(raw: string): string {
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

function buildMessage(parts: {
  baseMessage: string;
  service?: string;
  phone?: string;
  location?: string;
  urgent?: boolean;
  email?: string;
}): string {
  const lines = [
    parts.service ? `Serviciu: ${serviceLabel(parts.service)}` : null,
    parts.location ? `Locație: ${parts.location}` : null,
    parts.urgent ? 'Urgență: da' : null,
    parts.phone ? `Telefon: ${parts.phone}` : null,
    parts.email ? `Email: ${parts.email}` : null,
    '',
    parts.baseMessage,
  ].filter((line): line is string => typeof line === 'string' && line.length > 0);
  return lines.join('\n');
}

function htmlResponse(status: number, title: string, body: string, extraHeaders?: Record<string, string>): Response {
  const html = `<!doctype html>
<html lang="ro">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="robots" content="noindex,nofollow" />
    <style>
      :root { color-scheme: dark; }
      body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background: #05070a; color: #fff; }
      main { max-width: 760px; margin: 0 auto; padding: 32px 18px; }
      .card { border: 1px solid rgba(255,255,255,.12); background: rgba(0,0,0,.35); border-radius: 18px; padding: 22px; }
      h1 { margin: 0 0 12px; font-size: 32px; line-height: 1.1; }
      p { margin: 10px 0; color: rgba(255,255,255,.84); }
      a { color: #f2c94c; text-decoration: none; }
      a:hover { text-decoration: underline; }
      .actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
      .actions a { display: inline-block; padding: 10px 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.06); font-weight: 700; }
    </style>
  </head>
  <body>
    <main>
      <div class="card">
        <h1>${title}</h1>
        ${body}
      </div>
    </main>
  </body>
</html>`;
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      ...(extraHeaders ?? {}),
    },
  });
}

function successHtml(conversationId: string): Response {
  return htmlResponse(
    200,
    'Solicitare trimisă',
    `<p>Solicitarea a fost înregistrată cu succes și ajunge direct în sistemul nostru intern de ofertare.</p>
<p>Revenim cât mai repede telefonic sau pe email, în funcție de datele trimise.</p>
<p><strong>ID solicitare:</strong> ${conversationId}</p>
<div class="actions">
  <a href="/contact">Înapoi la contact</a>
  <a href="/servicii">Vezi serviciile</a>
  <a href="tel:+40769889721">Sună acum</a>
</div>`,
  );
}

function errorHtml(status: number, message: string, extraHeaders?: Record<string, string>): Response {
  return htmlResponse(
    status,
    'Nu am putut procesa solicitarea',
    `<p>${message}</p>
<div class="actions">
  <a href="/contact">Înapoi la formular</a>
  <a href="mailto:solaris-cet@protonmail.com">Trimite email direct</a>
  <a href="tel:+40769889721">Sună acum</a>
</div>`,
    extraHeaders,
  );
}

async function readSupportInput(req: Request): Promise<SupportInput> {
  const contentType = String(req.headers.get('content-type') ?? '').toLowerCase();
  const isHtmlForm = contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data');

  let raw: Record<string, unknown>;
  if (isHtmlForm) {
    const form = await req.formData();
    raw = Object.fromEntries(form.entries());
  } else {
    const body = await readJson(req);
    raw = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  }

  const name = asTrimmedString(raw.name, 120) || null;
  const emailRaw = asTrimmedString(raw.email, 254).toLowerCase();
  const pageUrl = asTrimmedString(raw.pageUrl, 600) || null;
  const utm = parseUtm(raw.utm);
  const consent = parseBoolean(raw.consent);
  const honeypot = asTrimmedString(raw.company, 120);

  if (isHtmlForm) {
    const message = buildMessage({
      baseMessage: asTrimmedString(raw.message, 2000),
      service: asTrimmedString(raw.service, 120) || undefined,
      phone: asTrimmedString(raw.phone, 80) || undefined,
      location: asTrimmedString(raw.location, 160) || undefined,
      urgent: parseBoolean(raw.urgent),
      email: emailRaw || undefined,
    });
    return { name, email: emailRaw, message, pageUrl, utm, isHtmlForm, consent, honeypot };
  }

  const message = asTrimmedString(raw.message, 2000);
  return { name, email: emailRaw, message, pageUrl, utm, isHtmlForm, consent, honeypot };
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (req.method === 'OPTIONS') return corsOptions(req);
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  let input: SupportInput;
  try {
    input = await readSupportInput(req);
  } catch {
    return corsJson(req, 400, { error: 'Invalid request payload' });
  }

  const rateLimit = decideRateLimit({
    req,
    bucket: 'support_start',
    limit: 5,
    windowSeconds: 600,
    keyPart: input.email,
  });
  const limitHeaders = rateLimitHeaders(rateLimit);
  if (!rateLimit.ok) {
    if (input.isHtmlForm) {
      return errorHtml(429, 'Ai trimis prea multe solicitări într-un interval scurt. Te rugăm să încerci din nou în câteva minute.', limitHeaders);
    }
    return corsJson(req, 429, { error: 'Too many requests' }, limitHeaders);
  }

  if (input.honeypot) {
    return input.isHtmlForm
      ? htmlResponse(200, 'Solicitare primită', '<p>Mulțumim. Cererea a fost primită.</p>', limitHeaders)
      : new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': allowedOrigin,
            Vary: 'Origin',
            'Cache-Control': 'no-store',
            ...limitHeaders,
          },
        });
  }

  if (!input.message || input.message.length > 2200) {
    return input.isHtmlForm
      ? errorHtml(400, 'Completează câmpul de detalii cu suficiente informații despre proiect.')
      : corsJson(req, 400, { error: 'Invalid message' });
  }
  if (input.email && !isValidEmail(input.email)) {
    return input.isHtmlForm ? errorHtml(400, 'Adresa de email introdusă nu este validă.') : corsJson(req, 400, { error: 'Invalid email' });
  }
  if (input.isHtmlForm && !input.consent) {
    return errorHtml(400, 'Este necesar acordul pentru a putea procesa solicitarea și a reveni cu ofertă.');
  }

  const user = await requireUser(req);
  const db = getDb();

  const contact = input.email
    ? (
        await db
          .insert(schema.contacts)
          .values({ userId: user?.id ?? null, email: input.email, name: input.name ?? null })
          .onConflictDoUpdate({ target: schema.contacts.email, set: { userId: user?.id ?? null, email: input.email, name: input.name ?? null } })
          .returning()
      )[0]
    : (
        await db
          .insert(schema.contacts)
          .values({ userId: user?.id ?? null, email: null, name: input.name ?? null })
          .returning()
      )[0];

  const [conv] = await db
    .insert(schema.crmConversations)
    .values({
      contactId: contact.id,
      userId: user?.id ?? null,
      status: 'open',
      pageUrl: input.pageUrl,
      utm: input.utm,
      updatedAt: new Date(),
    })
    .returning();

  await db.insert(schema.crmMessages).values({
    conversationId: conv.id,
    sender: user ? 'user' : 'visitor',
    body: input.message,
  });

  if (user && input.email) {
    await db
      .insert(schema.contacts)
      .values({ userId: user.id, email: input.email, name: input.name ?? null })
      .onConflictDoUpdate({ target: schema.contacts.email, set: { userId: user.id, email: input.email, name: input.name ?? null } });
  }

  if (input.isHtmlForm) return successHtml(conv.id);

  return new Response(JSON.stringify({ ok: true, conversationId: conv.id }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
      'Cache-Control': 'no-store',
      ...limitHeaders,
    },
  });
}
