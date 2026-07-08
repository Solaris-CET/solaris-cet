import { getDb, schema } from '@/db/client';
import { requireUser } from '@/api/lib/authUser';
import { getAllowedOrigin } from '@/api/lib/cors';
import { corsJson, corsOptions, isValidEmail, readJson } from '@/api/lib/http';
import { decideRateLimit, rateLimitHeaders } from '@/api/lib/publicApiRateLimit';
import {
  buildSupportStartJsonSuccess,
  isSupportHtmlFormContentType,
  isValidSupportStartMessage,
  parseSupportStartFromRecord,
  SUPPORT_START_PROBE,
  type SupportStartInput,
} from '../../lib/supportStart';

export { SUPPORT_START_PATH, SUPPORT_START_PROBE } from '@/api/lib/supportStart';

export const config = { runtime: 'nodejs' };

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

async function readSupportInput(req: Request): Promise<SupportStartInput> {
  const contentType = String(req.headers.get('content-type') ?? '');
  const isHtmlForm = isSupportHtmlFormContentType(contentType);

  let raw: Record<string, unknown>;
  if (isHtmlForm) {
    const form = await req.formData();
    raw = Object.fromEntries(form.entries());
  } else {
    const body = await readJson(req);
    raw = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  }

  return parseSupportStartFromRecord(raw, isHtmlForm);
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (req.method === 'OPTIONS') return corsOptions(req);
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  let input: SupportStartInput;
  try {
    input = await readSupportInput(req);
  } catch {
    return corsJson(req, 400, { error: SUPPORT_START_PROBE.invalidPayloadError });
  }

  const rateLimit = decideRateLimit({
    req,
    bucket: SUPPORT_START_PROBE.rateLimitKey,
    limit: SUPPORT_START_PROBE.rateLimit,
    windowSeconds: SUPPORT_START_PROBE.rateWindowSeconds,
    keyPart: input.email,
  });
  const limitHeaders = rateLimitHeaders(rateLimit);
  if (!rateLimit.ok) {
    if (input.isHtmlForm) {
      return errorHtml(
        SUPPORT_START_PROBE.tooManyRequestsStatus,
        'Ai trimis prea multe solicitări într-un interval scurt. Te rugăm să încerci din nou în câteva minute.',
        limitHeaders,
      );
    }
    return corsJson(req, SUPPORT_START_PROBE.tooManyRequestsStatus, { error: SUPPORT_START_PROBE.tooManyRequestsError }, limitHeaders);
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

  if (!isValidSupportStartMessage(input.message)) {
    return input.isHtmlForm
      ? errorHtml(400, 'Completează câmpul de detalii cu suficiente informații despre proiect.')
      : corsJson(req, 400, { error: SUPPORT_START_PROBE.invalidMessageError });
  }
  if (input.email && !isValidEmail(input.email)) {
    return input.isHtmlForm
      ? errorHtml(400, 'Adresa de email introdusă nu este validă.')
      : corsJson(req, 400, { error: SUPPORT_START_PROBE.invalidEmailError });
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
      status: SUPPORT_START_PROBE.conversationStatus,
      pageUrl: input.pageUrl,
      utm: input.utm,
      updatedAt: new Date(),
    })
    .returning();

  await db.insert(schema.crmMessages).values({
    conversationId: conv.id,
    sender: user ? SUPPORT_START_PROBE.userSender : SUPPORT_START_PROBE.visitorSender,
    body: input.message,
  });

  if (user && input.email) {
    await db
      .insert(schema.contacts)
      .values({ userId: user.id, email: input.email, name: input.name ?? null })
      .onConflictDoUpdate({ target: schema.contacts.email, set: { userId: user.id, email: input.email, name: input.name ?? null } });
  }

  if (input.isHtmlForm) return successHtml(conv.id);

  return new Response(JSON.stringify(buildSupportStartJsonSuccess(conv.id)), {
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