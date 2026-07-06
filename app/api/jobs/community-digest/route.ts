import { and, desc, eq, gte, sql } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { getAllowedOrigin } from '../../lib/cors';
import { requireCron } from '../../lib/cron';
import { corsJson, corsOptions } from '../../lib/http';

export const config = { runtime: 'nodejs' };

function canSendEmail(): boolean {
  const provider = String(process.env.EMAIL_PROVIDER ?? '').trim().toLowerCase();
  if (provider === 'postmark') return Boolean(String(process.env.POSTMARK_SERVER_TOKEN ?? '').trim());
  return Boolean(String(process.env.RESEND_API_KEY ?? '').trim());
}

function siteOrigin(): string {
  const raw = String(process.env.PUBLIC_SITE_URL ?? '').trim();
  if (raw) return raw.replace(/\/$/, '');
  return 'https://solaris-cet.com';
}

function renderDigestEmail(input: {
  locale: string | null;
  origin: string;
  weekFrom: string;
  weekTo: string;
  posts: { title: string; url: string; score: number }[];
}): { subject: string; html: string; text: string } {
  const subject =
    input.locale === 'en'
      ? 'Solaris CET — Community weekly digest'
      : input.locale === 'es'
        ? 'Solaris CET — Resumen semanal de la comunidad'
        : 'Solaris CET — Digest săptămânal (Comunitate)';

  const title =
    input.locale === 'en'
      ? 'Weekly community digest'
      : input.locale === 'es'
        ? 'Resumen semanal'
        : 'Digest săptămânal';

  const intro =
    input.locale === 'en'
      ? `Top posts from ${input.weekFrom} to ${input.weekTo}.`
      : input.locale === 'es'
        ? `Mejores publicaciones del ${input.weekFrom} al ${input.weekTo}.`
        : `Cele mai bune postări din perioada ${input.weekFrom} – ${input.weekTo}.`;

  const lines = input.posts
    .map((p, idx) => `<li style="margin:0 0 10px;"><a href="${p.url}" style="color:#e5faff;text-decoration:none;font-weight:700;">${idx + 1}. ${p.title}</a><div style="margin-top:4px;color:rgba(229,231,235,0.7);font-size:12px;">score ${p.score}</div></li>`)
    .join('');

  const forumUrl = `${input.origin}/forum`;
  const cta =
    input.locale === 'en' ? 'Open forum' : input.locale === 'es' ? 'Abrir foro' : 'Deschide forum';

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
        <h1 style="margin:10px 0 0;font-size:20px;line-height:1.25;color:#ffffff;">${title}</h1>
        <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:rgba(229,231,235,0.9);">${intro}</p>
        <ol style="margin:16px 0 0;padding-left:18px;line-height:1.45;">${lines || ''}</ol>
        <div style="margin-top:18px;">
          <a href="${forumUrl}" style="display:inline-block;background:rgba(46,231,255,0.16);border:1px solid rgba(46,231,255,0.35);color:#e5faff;text-decoration:none;font-weight:800;padding:12px 16px;border-radius:12px;">${cta}</a>
        </div>
      </div>
    </div>
  </body>
</html>`;

  const textLines = input.posts.map((p, idx) => `${idx + 1}. ${p.title} (score ${p.score})\n${p.url}`).join('\n\n');
  const text = `Solaris CET\n\n${title}\n${intro}\n\n${textLines}\n\n${forumUrl}`;
  return { subject, html, text };
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });
  if (!requireCron(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }
  if (!canSendEmail()) return corsJson(req, 501, { error: 'Email provider not configured' });

  const db = getDb();
  const now = new Date();
  const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekFrom = since.toISOString().slice(0, 10);
  const weekTo = now.toISOString().slice(0, 10);

  const votesJoin = and(eq(schema.forumVotes.targetType, 'post'), eq(schema.forumVotes.targetId, schema.forumPosts.id));
  const topPosts = await db
    .select({
      id: schema.forumPosts.id,
      title: schema.forumPosts.title,
      score: sql<number>`coalesce(sum(${schema.forumVotes.value}), 0)`.as('score'),
    })
    .from(schema.forumPosts)
    .leftJoin(schema.forumVotes, votesJoin)
    .where(and(eq(schema.forumPosts.status, 'visible'), gte(schema.forumPosts.createdAt, since)))
    .groupBy(schema.forumPosts.id)
    .orderBy(desc(sql`coalesce(sum(${schema.forumVotes.value}), 0)`))
    .limit(10);

  const subs = await db
    .select({
      email: schema.contacts.email,
      locale: schema.newsletterSubscriptions.locale,
    })
    .from(schema.newsletterSubscriptions)
    .innerJoin(schema.contacts, eq(schema.newsletterSubscriptions.contactId, schema.contacts.id))
    .where(eq(schema.newsletterSubscriptions.status, 'active'))
    .limit(500);

  const originBase = siteOrigin();
  const posts = topPosts.map((p) => ({
    title: p.title,
    url: `${originBase}/forum/${encodeURIComponent(p.id)}`,
    score: p.score ?? 0,
  }));

  let queued = 0;
  for (const s of subs) {
    const to = (s.email ?? '').trim();
    if (!to) continue;
    const rendered = renderDigestEmail({
      locale: s.locale ?? 'ro',
      origin: originBase,
      weekFrom,
      weekTo,
      posts,
    });
    await db.insert(schema.emailOutbox).values({
      toEmail: to,
      template: 'community_digest_weekly',
      subject: rendered.subject,
      html: rendered.html,
      textBody: rendered.text,
      payload: { weekFrom, weekTo, kind: 'forum' },
      status: 'pending',
      sendAfter: new Date(),
      sentAt: null,
      lastError: null,
      createdAt: new Date(),
    });
    queued += 1;
  }

  return corsJson(req, 200, { ok: true, queued, subscribers: subs.length, posts: posts.length });
}

