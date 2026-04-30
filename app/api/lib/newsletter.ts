import crypto from 'node:crypto'

export type NewsletterLocale = 'en' | 'ro' | 'es'

export function isNewsletterLocale(v: unknown): v is NewsletterLocale {
  return v === 'en' || v === 'ro' || v === 'es'
}

export function normalizeEmail(v: unknown): string {
  return typeof v === 'string' ? v.trim().toLowerCase() : ''
}

export function isValidEmail(email: string): boolean {
  const e = email.trim()
  if (e.length < 6 || e.length > 254) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}

export function createConfirmToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString('base64url')
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  return { token, tokenHash }
}

export function hashConfirmToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function parseOrigin(req: Request): string {
  try {
    return new URL(req.url).origin
  } catch {
    return 'http://localhost'
  }
}

export function readFromEmail(): string {
  return String(process.env.NEWSLETTER_FROM ?? process.env.RESEND_FROM ?? '').trim()
}

export function confirmUrl(origin: string, locale: NewsletterLocale, token: string): string {
  const url = new URL(`${origin}/${locale}/newsletter/confirm`)
  url.searchParams.set('token', token)
  return url.toString()
}

export function articlesUrl(origin: string, locale: NewsletterLocale): string {
  return new URL(`${origin}/${locale}/blog`).toString()
}

export function renderConfirmEmail(locale: NewsletterLocale, url: string): { subject: string; html: string; text: string } {
  const copy =
    locale === 'ro'
      ? {
          subject: 'Confirmă abonarea la Newsletter Solaris CET',
          title: 'Confirmă abonarea',
          body: 'Ai cerut să te abonezi la newsletter. Confirmă adresa de email prin linkul de mai jos.',
          cta: 'Confirmă abonarea',
          footer: 'Dacă nu tu ai făcut cererea, poți ignora acest email.',
        }
      : locale === 'es'
        ? {
            subject: 'Confirma tu suscripción al newsletter de Solaris CET',
            title: 'Confirma tu suscripción',
            body: 'Has solicitado suscribirte al newsletter. Confirma tu email usando el enlace de abajo.',
            cta: 'Confirmar suscripción',
            footer: 'Si no fuiste tú, puedes ignorar este correo.',
          }
        : {
            subject: 'Confirm your Solaris CET newsletter subscription',
            title: 'Confirm your subscription',
            body: 'You requested to subscribe to our newsletter. Confirm your email via the link below.',
            cta: 'Confirm subscription',
            footer: 'If this wasn’t you, you can safely ignore this email.',
          }

  const safeUrl = url
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background:#0b0f17;color:#e5e7eb;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:28px 18px;">
      <div style="border:1px solid rgba(255,255,255,0.10);background:rgba(255,255,255,0.04);border-radius:16px;padding:22px;">
        <div style="font-weight:800;letter-spacing:-0.02em;font-size:18px;color:#f2c94c;">Solaris CET</div>
        <h1 style="margin:10px 0 0;font-size:20px;line-height:1.25;color:#ffffff;">${copy.title}</h1>
        <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:rgba(229,231,235,0.9);">${copy.body}</p>
        <div style="margin-top:18px;">
          <a href="${safeUrl}" style="display:inline-block;background:#f2c94c;color:#111827;text-decoration:none;font-weight:800;padding:12px 16px;border-radius:12px;">${copy.cta}</a>
        </div>
        <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:rgba(229,231,235,0.72);">${copy.footer}</p>
        <p style="margin:10px 0 0;font-size:12px;line-height:1.6;color:rgba(229,231,235,0.55);word-break:break-all;">${safeUrl}</p>
      </div>
    </div>
  </body>
</html>`

  const text = `Solaris CET\n\n${copy.title}\n${copy.body}\n\n${safeUrl}\n\n${copy.footer}`
  return { subject: copy.subject, html, text }
}

export function renderWelcomeEmail(
  locale: NewsletterLocale,
  origin: string,
): { subject: string; html: string; text: string } {
  const link = articlesUrl(origin, locale)
  const copy =
    locale === 'ro'
      ? {
          subject: 'Bun venit în newsletter-ul Solaris CET',
          title: 'Bun venit',
          body: 'Abonarea ta este activă. Vei primi ocazional update-uri și articole noi.',
          cta: 'Vezi articolele',
        }
      : locale === 'es'
        ? {
            subject: 'Bienvenido al newsletter de Solaris CET',
            title: 'Bienvenido',
            body: 'Tu suscripción está activa. Recibirás actualizaciones y nuevos artículos de vez en cuando.',
            cta: 'Ver artículos',
          }
        : {
            subject: 'Welcome to the Solaris CET newsletter',
            title: 'Welcome',
            body: 'Your subscription is active. You will occasionally receive updates and new articles.',
            cta: 'Read articles',
          }

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background:#0b0f17;color:#e5e7eb;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:28px 18px;">
      <div style="border:1px solid rgba(255,255,255,0.10);background:rgba(255,255,255,0.04);border-radius:16px;padding:22px;">
        <div style="font-weight:800;letter-spacing:-0.02em;font-size:18px;color:#f2c94c;">Solaris CET</div>
        <h1 style="margin:10px 0 0;font-size:20px;line-height:1.25;color:#ffffff;">${copy.title}</h1>
        <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:rgba(229,231,235,0.9);">${copy.body}</p>
        <div style="margin-top:18px;">
          <a href="${link}" style="display:inline-block;background:rgba(46,231,255,0.16);border:1px solid rgba(46,231,255,0.35);color:#e5faff;text-decoration:none;font-weight:800;padding:12px 16px;border-radius:12px;">${copy.cta}</a>
        </div>
      </div>
    </div>
  </body>
</html>`

  const text = `Solaris CET\n\n${copy.title}\n${copy.body}\n\n${link}`
  return { subject: copy.subject, html, text }
}

